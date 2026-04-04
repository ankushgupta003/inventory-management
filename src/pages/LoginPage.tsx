import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* LEFT SIDE */}
      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500">
              Please enter your login details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="admin@erp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Log in"}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6">
            <p className="text-xs text-gray-500 mb-2">
              Quick Login (Demo):
            </p>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemo("admin@erp.com", "admin123")}
              >
                Admin Login
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemo("manager@erp.com", "manager123")}
              >
                Manager Login
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemo("staff@erp.com", "staff123")}
              >
                Staff Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FLOATING PARTICLES */}
      <div className="hidden md:flex items-center justify-center relative bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-400/20"
            style={{
              width: `${20 + i * 10}px`,
              height: `${20 + i * 10}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, i % 2 === 0 ? 20 : -20, 0],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
            }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 max-w-md text-center px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Inventory Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage stock, batches, production, and sales efficiently with a
            clean and powerful ERP system.
          </p>
        </div>
      </div>
    </div>
  );
}