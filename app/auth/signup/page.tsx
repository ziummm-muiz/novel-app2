import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { signup } from "../actions/actions";

export default function SignUpPage() {
  return (
    <form>
        <FieldSet>
            <FieldLegend>Sign Up</FieldLegend>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                    <Input id="full_name" name="full_name" type="text" placeholder="John Doe" required/>
                </Field>
                <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input id="username" name="username" type="text" placeholder="johndoe" required/>
                </Field>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" name="email" type="email" placeholder="johnDoe@email.com" required/>
                </Field>
                <Field>
                    <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                    <Input id="phone" name="phone" type="tel" placeholder="+1234567890" required/>
                </Field>
                <Field>
                    <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
                    <Input id="dob" name="dob" type="date" required/>
                </Field>
                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" name="password" type="password" placeholder="password" required/>
                </Field>
                <Button type="submit" formAction={signup}>Sign UP</Button>
            </FieldGroup>
        </FieldSet>
    </form>
  )
}

