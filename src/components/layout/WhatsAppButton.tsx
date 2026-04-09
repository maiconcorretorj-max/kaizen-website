'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { getSectionsByPageSlugClient, getSiteSettingsClient } from '@/lib/cms/client'
import { mapSectionsToLegacyContent } from '@/lib/cms/section-mapper'

const WHATSAPP_NUMBER = '5521999999999'
const DEFAULT_MESSAGE = 'Olá! Gostaria de mais informações sobre os imóveis da Kaizen Soluções Imobiliárias.'

interface WhatsAppButtonProps {
  whatsappNumber?: string
}

function normalizeWhatsapp(value: string | undefined) {
  if (!value) return WHATSAPP_NUMBER
  const digits = value.replace(/\D/g, '')
  return digits.length > 0 ? digits : WHATSAPP_NUMBER
}

export default function WhatsAppButton({ whatsappNumber }: WhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [dynamicNumber, setDynamicNumber] = useState(whatsappNumber)

  useEffect(() => {
    const loadNumber = async () => {
      const [sections, settings] = await Promise.all([
        getSectionsByPageSlugClient('contato'),
        getSiteSettingsClient(['contact_info']),
      ])
      const mapped = mapSectionsToLegacyContent('contato', sections)
      const sectionWhatsapp = mapped.contact_whatsapp
      const contactInfo = settings.contact_info ?? {}
      const settingsWhatsapp = typeof contactInfo.whatsapp === 'string' ? contactInfo.whatsapp : ''
      const resolved = sectionWhatsapp || settingsWhatsapp || whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || WHATSAPP_NUMBER
      if (typeof resolved === 'string' && resolved.trim().length > 0) {
        setDynamicNumber(resolved)
      }
    }

    loadNumber()
  }, [])

  const resolvedNumber = normalizeWhatsapp(dynamicNumber)

  const whatsappUrl = `https://wa.me/${resolvedNumber}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl p-4 max-w-[220px] border border-gray-100"
          >
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-gray-700 text-sm font-medium mb-1">Fale conosco!</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Clique para falar com um de nossos corretores no WhatsApp.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        className="bg-[#25D366] hover:bg-[#20BA5A] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors relative"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="h-7 w-7 fill-white stroke-none" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
      </motion.a>
    </div>
  )
}
