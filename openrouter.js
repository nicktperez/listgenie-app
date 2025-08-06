import Head from "next/head";
import dynamic from "next/dynamic";

const OpenRouterModels = dynamic(() => import("../components/OpenRouterModels"), {
  ssr: false, // <--- important: disables static generation for this part
});

export default function OpenRouterPage() {
  return (
    <>
      <Head>
        <title>OpenRouter Models</title>
      </Head>
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Available OpenRouter Models</h1>
        <OpenRouterModels />
      </main>
    </>
  );
}