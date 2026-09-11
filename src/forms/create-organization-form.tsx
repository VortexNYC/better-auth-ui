import { useState } from "react";
import { Input } from "@cloudflare/kumo/components/input";
import { Button } from "@cloudflare/kumo/components/button";
import { z } from "zod";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";
import type { AuthOrganization } from "../types";

const slugRegex = /^[a-z0-9-]+$/;

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required."),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .regex(
      slugRegex,
      "Slug must contain only lowercase letters, numbers, and hyphens.",
    ),
  logo: z.string().optional(),
});

type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>;

export interface CreateOrganizationFormProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onSuccess?: (organization: AuthOrganization) => void;
  onCancel?: () => void;
}

/**
 * Form for creating a new Better Auth organization.
 */
export function CreateOrganizationForm({
  className,
  errorClassName,
  title = "Create workspace",
  description = "Set up a new workspace for your team.",
  submitLabel = "Create workspace",
  submittingLabel = "Creating…",
  cancelLabel = "Cancel",
  showCancel = true,
  onSuccess,
  onCancel,
}: CreateOrganizationFormProps) {
  const client = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<CreateOrganizationValues>
  >({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = createOrganizationSchema.safeParse({
      name,
      slug,
      logo: logo || undefined,
    });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      setFieldErrors({
        name: flattened.name?.[0],
        slug: flattened.slug?.[0],
        logo: flattened.logo?.[0],
      });
      return;
    }

    if (client.organization?.create === undefined) {
      setError("Organization creation is not available.");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await client.organization.create(validation.data);

      if (response.error !== null) {
        setError(response.error.message ?? "Could not create workspace.");
        return;
      }

      if (response.data) {
        onSuccess?.(response.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create workspace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard className={className} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} className={errorClassName} />

        <Input
          label="Workspace name"
          value={name}
          onValueChange={(value) => {
            setName(value);
            if (slug.length === 0) {
              setSlug(
                value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              );
            }
          }}
          error={fieldErrors.name}
          placeholder="Acme Corp"
          required
        />

        <Input
          label="Slug"
          value={slug}
          onValueChange={setSlug}
          error={fieldErrors.slug}
          placeholder="acme-corp"
          description="Used in URLs. Lowercase letters, numbers, and hyphens only."
          required
        />

        <Input
          label="Logo URL (optional)"
          value={logo}
          onValueChange={setLogo}
          error={fieldErrors.logo}
          placeholder="https://…"
        />

        <div className="flex gap-2">
          <AuthSubmitButton loading={isSubmitting} className="flex-1">
            {isSubmitting ? submittingLabel : submitLabel}
          </AuthSubmitButton>
          {showCancel ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onCancel?.()}
              className="flex-1"
            >
              {cancelLabel}
            </Button>
          ) : null}
        </div>
      </form>
    </AuthCard>
  );
}
