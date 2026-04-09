export default function PublicLoading() {
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-[#0A2A66] to-[#1E4ED8]">
      <div className="h-52 bg-white/5 animate-pulse" />
      <div className="container mx-auto px-4 max-w-7xl py-10">
        <div className="h-8 w-56 bg-white/20 rounded mb-4 animate-pulse" />
        <div className="h-4 w-80 bg-white/15 rounded mb-10 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-white/10 border border-white/20 rounded-2xl animate-pulse" />
          <div className="h-72 bg-white/10 border border-white/20 rounded-2xl animate-pulse" />
          <div className="h-72 bg-white/10 border border-white/20 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
