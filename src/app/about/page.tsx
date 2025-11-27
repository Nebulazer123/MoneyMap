export default function AboutPage() {
  return (
    <main className="bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">About MoneyMap</h1>
          <p className="text-zinc-300">
            MoneyMap is a personal finance dashboard concept that currently runs only
            on synthetic data in Phase one. It does not accept real uploads or connect
            to any bank.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Vision</h2>
            <p className="text-sm text-zinc-300">
              The long-term idea is a tool that lets you upload statements locally in
              the browser, classify income, spending, subscriptions, fees, and internal
              transfers, and receive calm guidance without selling your data.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p className="text-sm text-zinc-300">
              This is a demo project. For now, you can imagine a contact email such as
              <span className="ml-1 font-medium text-white">support@example.com</span>{" "}
              for questions or feedback.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Privacy and future policy
            </h2>
            <p className="text-sm text-zinc-300">
              This Phase one build does not accept real uploads and keeps all synthetic
              data in the browser. Future versions will continue to prioritize local
              analysis and explicit user control.
            </p>
            <div className="space-y-1 text-sm text-zinc-500">
              <p>Privacy policy (coming later)</p>
              <p>Terms of use (coming later)</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
