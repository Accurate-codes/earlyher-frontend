import { PageHeading, PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { ui } from "@/content/en/ui";

export default function NotFound() {
  return (
    <PageShell>
      <PageHeading title={ui.notFound.title} lead={ui.notFound.text} />
      <div className="flex justify-center">
        <ButtonLink href="/" size="lg">
          {ui.common.home}
        </ButtonLink>
      </div>
    </PageShell>
  );
}
