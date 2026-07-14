import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { moduleTwoContent } from "./moduleTwoContent";
import type { Campaign } from "./types";
import { CampaignDetail } from "./components/CampaignDetail";
import { CampaignDirectory } from "./components/CampaignDirectory";
import { CampaignForm } from "./components/CampaignForm";

function getCampaignIdentifier(campaign: Campaign | null) {
  if (!campaign) {
    return null;
  }

  return campaign.slug ? ({ slug: campaign.slug } as const) : ({ id: campaign.id } as const);
}

export function ModuleTwoPage() {
  const content = moduleTwoContent;
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null);
  const detailHeadingId = "module-two-detail-heading";
  const createHeadingId = "module-two-create-heading";
  const selectedCampaignIdentifier = React.useMemo(() => getCampaignIdentifier(selectedCampaign), [selectedCampaign]);

  return (
    <div id="module-two" className="min-h-screen bg-background text-foreground">
      <main>
        <section
          className="relative isolate overflow-hidden bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
          aria-labelledby="module-two-hero-heading"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_34rem)]"
          />
          <div
            aria-hidden="true"
            className="absolute right-0 top-16 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-center">
            <div className="max-w-3xl space-y-7 text-center lg:text-left">
              <div className="space-y-5">
                <p className="mx-auto inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm lg:mx-0">
                  {content.hero.eyebrow}
                </p>
                <div className="space-y-4">
                  <h1
                    id="module-two-hero-heading"
                    className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
                  >
                    {content.hero.title}
                  </h1>
                  <p className="mx-auto max-w-2xl text-pretty text-lg leading-8 text-muted-foreground lg:mx-0">
                    {content.hero.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Button asChild size="lg">
                  <a href="#module-two-create" aria-label="Jump to campaign creation form">
                    {content.hero.primaryCta}
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#module-two-directory" aria-label="Jump to campaign directory">
                    {content.hero.secondaryCta}
                  </a>
                </Button>
              </div>

              <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground lg:mx-0">
                {content.hero.trustNote}
              </p>
            </div>

            <Card className="border-primary/20 bg-card/90 shadow-xl shadow-primary/10 backdrop-blur">
              <CardContent className="space-y-4 p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Workspace safeguards</p>
                <dl className="space-y-4">
                  {content.workspaceMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-border/80 bg-muted/30 p-4">
                      <dt className="text-sm font-medium text-muted-foreground">{metric.label}</dt>
                      <dd className="mt-1 text-xl font-bold text-foreground">{metric.value}</dd>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.description}</p>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        </section>

        <CampaignDirectory
          id="module-two-directory"
          content={content}
          selectedCampaignId={selectedCampaign?.id ?? null}
          onSelectCampaign={setSelectedCampaign}
        />

        <section
          id="module-two-workspace"
          className="bg-muted/30 px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
          aria-labelledby="module-two-workspace-heading"
        >
          <div className="mx-auto max-w-7xl space-y-10">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Creator workspace</p>
              <h2 id="module-two-workspace-heading" className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Draft campaigns and inspect campaign details in one flow
              </h2>
              <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                The creation form and detail panel are intentionally adjacent so fundraisers can compare campaign structure,
                public progress, and review requirements while building the management foundation.
              </p>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,1.05fr)] xl:items-start">
              <section id="module-two-create" aria-labelledby={createHeadingId}>
                <div className="mb-5 space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {content.sections.create.eyebrow}
                  </p>
                  <h2 id={createHeadingId} className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {content.sections.create.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    {content.sections.create.description}
                  </p>
                </div>

                <CampaignForm
                  title={content.createPanelTitle}
                  description={content.createPanelDescription}
                  detailBaseHref="#module-two-detail"
                  onCreated={(campaign) => setSelectedCampaign(campaign)}
                />
              </section>

              <section id="module-two-detail" aria-labelledby={detailHeadingId} className="xl:sticky xl:top-24">
                <div className="mb-5 space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {content.sections.detail.eyebrow}
                  </p>
                  <h2 id={detailHeadingId} className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {content.sections.detail.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    {content.sections.detail.description}
                  </p>
                </div>

                <CampaignDetail
                  aria-labelledby={detailHeadingId}
                  campaign={selectedCampaign}
                  identifier={selectedCampaignIdentifier}
                  emptyTitle={content.sections.detail.emptyTitle}
                  emptyDescription={content.sections.detail.emptyDescription}
                  updatesPlaceholderTitle={content.sections.detail.updatesPlaceholderTitle}
                  updatesPlaceholderDescription={content.sections.detail.updatesPlaceholderDescription}
                  donationCtaLabel={content.sections.detail.donationPlaceholderLabel}
                />
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ModuleTwoPage;
