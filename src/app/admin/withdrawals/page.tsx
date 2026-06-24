import RequestReview from "../_components/RequestReview";

export default function AdminWithdrawalsPage() {
  return (
    <RequestReview
      endpoint="/api/admin/withdrawals"
      title="Opnames"
      icon="🏧"
      approveLabel="Markeer betaald"
      detailKey="destination"
      detailLabel="Bestemming"
    />
  );
}
