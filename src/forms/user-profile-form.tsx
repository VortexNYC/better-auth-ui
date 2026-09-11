import { useEffect, useState } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";

import { AuthCard, AuthError, AuthSubmitButton } from "../auth-primitives";
import { useAuth } from "../auth-provider";

export interface UserProfileFormProps {
  className?: string;
  errorClassName?: string;
  title?: string;
  description?: string;
  nameLabel?: string;
  imageUrlLabel?: string;
  imageUrlPlaceholder?: string;
  submitLabel?: string;
  submittingLabel?: string;
  unavailableMessage?: string;
  onSuccess?: () => void;
}

/**
 * Form for updating the current Better Auth user's name and profile image.
 */
export function UserProfileForm({
  className,
  errorClassName,
  title = "Account",
  description = "Manage your profile.",
  nameLabel = "Name",
  imageUrlLabel = "Profile picture URL",
  imageUrlPlaceholder = "https://…",
  submitLabel = "Save",
  submittingLabel = "Saving…",
  unavailableMessage = "Profile update is not available.",
  onSuccess,
}: UserProfileFormProps) {
  const client = useAuth();
  const session = client.useSession?.();

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.data?.user) {
      setName(session.data.user.name ?? "");
      setImage(session.data.user.image ?? "");
    }
  }, [session?.data?.user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (client.updateUser === undefined) {
      setError(unavailableMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await client.updateUser({
        name,
        image: image.length > 0 ? image : null,
      });

      if (response.error !== null) {
        setError(response.error.message ?? "Could not update profile.");
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update profile.",
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
          label={nameLabel}
          value={name}
          onValueChange={setName}
          placeholder="Ada Lovelace"
          required
        />

        <Input
          label={imageUrlLabel}
          value={image}
          onValueChange={setImage}
          placeholder={imageUrlPlaceholder}
        />

        <AuthSubmitButton loading={isSubmitting} className="w-full">
          {isSubmitting ? submittingLabel : submitLabel}
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
