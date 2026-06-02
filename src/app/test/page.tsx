export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p className="mt-4">If you can see this, routing works!</p>
      <p className="mt-2">Current path: /test</p>
      <a href="/client/posting" className="mt-4 inline-block text-blue-600 underline">
        Try /client/posting
      </a>
    </div>
  )
}
