import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { login } from "../actions/actions";

export default function LoginPage() {
  return (
    <form>
        <FieldSet>
            <FieldLegend>Log In</FieldLegend>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" name="email" type="email" placeholder="johnDoe@email.com" required/>
                </Field>
                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" name="password" type="password" placeholder="password" required/>
                </Field>
                <Button type="submit" formAction={login}>Log In</Button>
            </FieldGroup>
        </FieldSet>
    </form>
  )
}