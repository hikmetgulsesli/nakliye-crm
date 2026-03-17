import PeriodicReportClient from "@/components/reports/PeriodicReportClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PeriodicReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const from = typeof params.from === 'string' ? params.from : '';
  const to = typeof params.to === 'string' ? params.to : '';
  const includeDrafts = params.includeDrafts !== 'false';
  const onlyHighValue = params.onlyHighValue === 'true';

  return (
    <PeriodicReportClient
      from={from}
      to={to}
      includeDrafts={includeDrafts}
      onlyHighValue={onlyHighValue}
    />
  );
}
