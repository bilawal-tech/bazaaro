import { getStatusMeta } from '../../utils/orderStatus';

function OrderStatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

export default OrderStatusBadge;
