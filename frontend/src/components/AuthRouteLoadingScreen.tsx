function AuthRouteLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <div className="h-7 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="space-y-3">
              <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-white/10" />
              <div className="h-5 w-3/4 animate-pulse rounded-xl bg-white/10" />
              <div className="h-5 w-2/3 animate-pulse rounded-xl bg-white/10" />
            </div>
            <div className="grid gap-3">
              <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
              <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white p-6">
            <div className="h-6 w-24 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-slate-200" />
            <div className="space-y-3 pt-2">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-900/10" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AuthRouteLoadingScreen
