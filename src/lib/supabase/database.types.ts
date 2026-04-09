export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cms_pages: {
        Row: {
          id: string
          slug: string
          title: string
          admin_label: string | null
          status: string
          meta_title: string | null
          meta_description: string | null
          meta_robots_index: boolean
          meta_robots_follow: boolean
          og_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          admin_label?: string | null
          status?: string
          meta_title?: string | null
          meta_description?: string | null
          meta_robots_index?: boolean
          meta_robots_follow?: boolean
          og_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          admin_label?: string | null
          status?: string
          meta_title?: string | null
          meta_description?: string | null
          meta_robots_index?: boolean
          meta_robots_follow?: boolean
          og_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          id: string
          page_id: string
          section_key: string
          section_type: string
          admin_title: string | null
          content: Json
          position: number
          is_active: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          section_key: string
          section_type: string
          admin_title?: string | null
          content?: Json
          position?: number
          is_active?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          section_key?: string
          section_type?: string
          admin_title?: string | null
          content?: Json
          position?: number
          is_active?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          title: string
          slug: string
          description: string
          type: string
          status: string
          condition: string | null
          price: number
          rent_price: number | null
          area: number
          bedrooms: number | null
          bathrooms: number | null
          parking_spaces: number | null
          address: string
          neighborhood: string
          city: string
          state: string
          zip_code: string | null
          latitude: number | null
          longitude: number | null
          images: string[]
          cover_image_url: string | null
          featured: boolean
          active: boolean
          publication_status: string
          published_at: string | null
          seo_title: string | null
          seo_description: string | null
          features: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description: string
          type: string
          status: string
          condition?: string | null
          price: number
          rent_price?: number | null
          area: number
          bedrooms?: number | null
          bathrooms?: number | null
          parking_spaces?: number | null
          address: string
          neighborhood: string
          city: string
          state: string
          zip_code?: string | null
          latitude?: number | null
          longitude?: number | null
          images?: string[]
          cover_image_url?: string | null
          featured?: boolean
          active?: boolean
          publication_status?: string
          published_at?: string | null
          seo_title?: string | null
          seo_description?: string | null
          features?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string
          type?: string
          status?: string
          condition?: string | null
          price?: number
          rent_price?: number | null
          area?: number
          bedrooms?: number | null
          bathrooms?: number | null
          parking_spaces?: number | null
          address?: string
          neighborhood?: string
          city?: string
          state?: string
          zip_code?: string | null
          latitude?: number | null
          longitude?: number | null
          images?: string[]
          cover_image_url?: string | null
          featured?: boolean
          active?: boolean
          publication_status?: string
          published_at?: string | null
          seo_title?: string | null
          seo_description?: string | null
          features?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      nav_tabs: {
        Row: {
          id: string
          label: string
          href: string
          order: number
          menu_location: string
          visible: boolean
          target: string
          parent_id: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          href: string
          order?: number
          menu_location?: string
          visible?: boolean
          target?: string
          parent_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          href?: string
          order?: number
          menu_location?: string
          visible?: boolean
          target?: string
          parent_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          id: string
          key: string
          title: string | null
          content: string
          type: string
          page: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          title?: string | null
          content: string
          type?: string
          page: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          title?: string | null
          content?: string
          type?: string
          page?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          subject: string | null
          message: string
          property_id: string | null
          read: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          subject?: string | null
          message: string
          property_id?: string | null
          read?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          subject?: string | null
          message?: string
          property_id?: string | null
          read?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          cover_image: string | null
          video_url: string | null
          published: boolean
          author_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string
          cover_image?: string | null
          video_url?: string | null
          published?: boolean
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string
          cover_image?: string | null
          video_url?: string | null
          published?: boolean
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_images: {
        Row: {
          id: string
          post_id: string
          image_url: string
          caption: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          image_url: string
          caption?: string | null
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          image_url?: string
          caption?: string | null
          order?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
