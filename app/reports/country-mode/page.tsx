import CountryModeReportClient from "@/components/reports/CountryModeReportClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CountryModeReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const from = typeof params.from === 'string' ? params.from : '';
  const to = typeof params.to === 'string' ? params.to : '';
  const includeDrafts = params.includeDrafts !== 'false';
  const onlyHighValue = params.onlyHighValue === 'true';

  return (
    <CountryModeReportClient
      from={from}
      to={to}
      includeDrafts={includeDrafts}
      onlyHighValue={onlyHighValue}
    />
  );
}
