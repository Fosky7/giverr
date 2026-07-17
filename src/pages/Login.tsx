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
 * Login page. Renders the shared {@link AuthForm} (login mode) inside the
 * existing centered Card + PageHeader layout. On success the form redirects
 * the user to the dashboard. Includes a "Forgot password?" link and a link to
 * the signup page.
 */
export function Login() {
  return (
    <section className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="mb-8">
        <PageHeader
          centered
          eyebrow="Welcome back"
          title="Sign in to Rayze"
          description="Access your campaigns and continue backing the ideas you love."
        />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AuthForm mode="login" redirectTo="/dashboard" />

          <div className="mt-4 text-center text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-primary transition-colors hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>

        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary transition-colors hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}

export default Login;
