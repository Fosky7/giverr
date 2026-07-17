import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthForm } from "@/components/auth/AuthForm";

/**
 * Signup page. Renders the shared {@link AuthForm} (signup mode) inside the
 * existing centered Card + PageHeader layout. The form handles validation,
 * email-confirmation messaging, and social sign-up, so this page is purely
 * presentational chrome around it.
 */
export function Signup() {
  return (
    <section className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="mb-8">
        <PageHeader
          centered
          eyebrow="Join Rayze"
          title="Create your account"
          description="Launch campaigns, back projects, and be part of a community funding bold ideas."
        />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Get started with a free Rayze account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AuthForm mode="signup" redirectTo="/dashboard" />
        </CardContent>

        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary transition-colors hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}

export default Signup;
