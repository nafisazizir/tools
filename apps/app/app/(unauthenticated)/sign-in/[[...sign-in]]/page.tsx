import { SignIn } from "@repo/auth/components/sign-in";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";

const title = "Welcome back";
const description = "Enter your details to sign in.";

export const metadata: Metadata = createMetadata({ title, description });

const SignInPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) => {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      {params.error === "unauthorized" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          <p className="font-semibold">Access Denied</p>
          <p className="mt-1">
            Your email is not authorized to access this application. Please
            contact the{" "}
            <a
              className="underline hover:brightness-80"
              href="mailto:hello@nafisazizi.com"
            >
              administrator
            </a>{" "}
            if you believe this is an error.
          </p>
        </div>
      )}
      <SignIn />
    </div>
  );
};

export default SignInPage;
