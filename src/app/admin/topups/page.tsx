import RequestReview from "../_components/RequestReview";

export default function AdminTopupsPage() {
  return (
    <RequestReview
      endpoint="/api/admin/topups"
      title="Opwaarderingen"
      icon="💳"
      approveLabel="Crediteren"
      detailKey="reference"
      detailLabel="Referentie"
    />
  );
}
