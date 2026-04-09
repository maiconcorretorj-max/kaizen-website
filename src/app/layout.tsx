import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: 'Kaizen Soluções Imobiliárias | Imóveis em Campo Grande - RJ',
    template: '%s | Kaizen Soluções Imobiliárias',
  },
  description:
    'Encontre o imóvel ideal em Campo Grande e toda região do Rio de Janeiro. Casas, apartamentos, coberturas e terrenos à venda e para alugar. Kaizen Soluções Imobiliárias.',
  keywords: [
    'imóveis Campo Grande RJ',
    'apartamentos Rio de Janeiro',
    'casas à venda',
    'imobiliária Campo Grande',
    'Kaizen imóveis',
    'imóveis Rio de Janeiro',
    'comprar imóvel RJ',
    'alugar imóvel Campo Grande',
  ],
  authors: [{ name: 'Kaizen Soluções Imobiliárias' }],
  creator: 'Kaizen Soluções Imobiliárias',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.kaizenimoveis.com.br',
    siteName: 'Kaizen Soluções Imobiliárias',
    title: 'Kaizen Soluções Imobiliárias | Imóveis em Campo Grande - RJ',
    description:
      'Realizando sonhos através do imóvel ideal. Imóveis à venda e para alugar em Campo Grande e toda região do Rio de Janeiro.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Kaizen Soluções Imobiliárias',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kaizen Soluções Imobiliárias',
    description: 'Realizando sonhos através do imóvel ideal.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
