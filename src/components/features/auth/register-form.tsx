"use client"

import { useSyncExternalStore, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { toast } from "sonner"
import { registerSchema } from "@/lib/validations/auth"
import { registerAction } from "@/server/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function RegisterForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsPending(true)
    setFormError(null)
    try {
      const result = await registerAction(values)

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.length) {
              form.setError(
                field as "fullName" | "phone" | "password" | "confirmPassword",
                { type: "server", message: messages[0] }
              )
            }
          }
        }
        if (result.formError) {
          setFormError(result.formError)
        }
        return
      }

      const signInResult = await signIn("credentials", {
        identifier: values.phone,
        password: values.password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast.success("Account created. Please sign in.")
        router.replace("/login")
        return
      }

      toast.success("Account created. Welcome aboard!")
      router.replace("/onboarding")
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Form {...form}>
      <form
        method="POST"
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit(onSubmit)(e)
        }}
        className="space-y-4"
      >
        {formError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  autoComplete="name"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 555 000 1234"
                  autoComplete="tel"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending || !hydrated}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  )
}
