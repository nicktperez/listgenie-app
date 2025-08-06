
import { getAuth } from "@clerk/nextjs/server";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/router";

export async function getServerSideProps(context) {
  const { userId } = getAuth(context.req);

  if (!userId) {
    return {
      redirect: {
        destination: "/sign-in",
        permanent: false,
      },
    };
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch OpenRouter models");
    }

    const models = await res.json();

    return {
      props: { models },
    };
  } catch (error) {
    console.error("Error fetching models:", error);
    return {
      props: { models: [] },
    };
  }
}

export default function OpenRouter({ models }) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
    }
  }, [user, router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available OpenRouter Models</h1>
      {models.length === 0 ? (
        <p>No models available or failed to load.</p>
      ) : (
        <ul className="space-y-2">
          {models.map((model) => (
            <li key={model.id} className="border p-2 rounded">
              <strong>{model.id}</strong> - {model.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
