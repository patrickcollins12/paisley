import { Button } from "@/components/ui/button.jsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Label } from "@/components/ui/label.jsx"
import { useState } from "react"
import { useAuth } from "@/auth/AuthContext.jsx"

export default function LoginForm() {
  const authContext = useAuth();

  // State variables to hold form data
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const [error, setError] = useState();

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      await authContext.login(username, password);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen justify-center">
      <form className="w-full max-w-sm" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Login to your Paisley Finance account
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Username</Label>
              <Input
                id="username"
                type="username"
                placeholder="username"
                onChange={(e) => setUsername(e.target.value)}
                required/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                required/>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}
            <div className="flex flex-col w-full">
              {error &&
                <div className="rounded-sm bg-warning text-warning-foreground text-center p-2 mb-6">
                  {error}
                </div>
              }
              <Button>Sign in</Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>

  )
}
