import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Truck, X, XCircle } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { ColumnVisibilityMenu } from '../components/ColumnVisibilityMenu';
import { Modal } from '../components/Modal';
import { RequestFilters, statuses } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import { SkeletonTable } from '../components/SkeletonTable';
import { api } from '../lib/api';
import { defaultRequestFilters, exportRequestsCsv, requestMetricsQueryString, requestQueryString } from '../lib/requests';
const defaultColumns = ['status', 'request_timestamp', 'cluster', 'dock_no', 'backlogs', 'plate_number', 'truck_size', 'truck_type'];
const columnOptions = [
    { key: 'status', label: 'Status' },
    { key: 'request_timestamp', label: 'Request time' },
    { key: 'cluster', label: 'Cluster' },
    { key: 'dock_no', label: 'Dock #' },
    { key: 'backlogs', label: 'Backlogs' },
    { key: 'ob_fte', label: 'Ops FTE' },
    { key: 'linehaul_trip_no', label: 'LHTrip #' },
    { key: 'plate_number', label: 'Plate #' },
    { key: 'mm_fte', label: 'FTE MM' },
    { key: 'truck_size', label: 'Truck size' },
    { key: 'truck_type', label: 'Truck type' },
    { key: 'provide_time', label: 'Provide time' },
    { key: 'docked_time', label: 'Docked time' },
    { key: 'doc_officer', label: 'DOC officer' },
];
export function MidmileRequests({ user, queue }) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState(defaultRequestFilters);
    const deferredSearch = useDeferredValue(filters.search);
    const [selected, setSelected] = useState(null);
    const [notice, setNotice] = useState('');
    const [exporting, setExporting] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
    const appliedFilters = { ...filters, search: deferredSearch };
    const requests = useQuery({
        queryKey: ['requests', 'midmile-all', appliedFilters],
        queryFn: () => api(`/requests?${requestQueryString(appliedFilters)}`),
        placeholderData: previous => previous,
        enabled: user.role === 'fte_mm',
    });
    const metrics = useQuery({
        queryKey: ['request-metrics', 'midmile-all', { search: appliedFilters.search, dateFrom: appliedFilters.dateFrom, dateTo: appliedFilters.dateTo }],
        queryFn: () => api(`/requests/metrics?${requestMetricsQueryString(appliedFilters)}`),
        placeholderData: previous => previous,
        enabled: user.role === 'fte_mm',
    });
    const transition = useMutation({
        mutationFn: ({ request, action, payload }) => api(`/requests/${request.id}/${action}`, { method: 'POST', body: JSON.stringify(payload) }),
        onSuccess: async (_, variables) => { setSelected(null); setNotice(variables.action === 'assign-truck' ? 'Truck confirmed.' : 'Request returned to Outbound.'); await queryClient.invalidateQueries({ queryKey: ['requests'] }); await queryClient.invalidateQueries({ queryKey: ['request-metrics'] }); },
    });
    const actions = (request) => request.status === 'APPROVED' ? _jsxs(_Fragment, { children: [_jsxs("button", { className: "table-action assign", type: "button", onClick: () => setSelected({ request, action: 'assign-truck' }), children: [_jsx(CheckCircle2, { size: 15 }), "Assign"] }), _jsxs("button", { className: "table-action reject", type: "button", onClick: () => setSelected({ request, action: 'reject-mm' }), children: [_jsx(XCircle, { size: 15 }), "Reject"] })] }) : null;
    function sortBy(sort) { setFilters(value => ({ ...value, sort, direction: value.sort === sort && value.direction === 'asc' ? 'desc' : 'asc', page: 1 })); }
    async function exportCsv() {
        setExporting(true);
        setNotice('');
        try {
            await exportRequestsCsv(appliedFilters, `truck-requests-${new Date().toISOString().slice(0, 10)}.csv`);
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'CSV export failed.');
        }
        finally {
            setExporting(false);
        }
    }
    const statusSummary = statuses.map(status => ({ value: status, count: status === 'ALL' ? (metrics.data?.total ?? 0) : (metrics.data?.by_status?.[status] ?? 0) }));
    return _jsxs("div", { className: "workspace-view", children: [(notice || transition.error) && _jsx("p", { className: `notice${transition.error || notice.includes('failed') ? ' error' : ' success-notice'}`, children: transition.error?.message || notice }), _jsxs("section", { className: "panel data-panel queue-panel", children: [_jsx("div", { className: "panel-head", children: _jsxs("div", { children: [_jsxs("div", { className: "section-title", children: [_jsx("h2", { children: "Pending confirmation" }), queue.count > 0 && _jsx("span", { className: "count-badge", children: queue.count })] }), _jsx("p", { children: "Approved requests awaiting FTE Midmile confirmation" })] }) }), queue.isPending ? _jsxs("div", { className: "table-loading-shell", children: [_jsxs("div", { className: "table-loading-toolbar", children: [_jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" })] }), _jsx(SkeletonTable, { columns: 4, rows: 4, compact: true })] }) : queue.error ? _jsx("p", { className: "state error", children: queue.error.message }) : _jsx(RequestTable, { rows: queue.rows, emptyMessage: "No approved requests are awaiting confirmation.", actions: actions })] }), _jsxs("section", { className: "request-list-section", children: [_jsx("div", { className: "request-toolbar-surface", children: _jsx(ColumnVisibilityMenu, { visible: visibleColumns, onChange: setVisibleColumns, options: columnOptions }) }), _jsx(RequestFilters, { filters: filters, exporting: exporting, statusSummary: statusSummary, onChange: setFilters, onExport: () => void exportCsv(), onRefresh: () => void requests.refetch() }), _jsx("section", { className: "panel data-panel", children: requests.isPending ? _jsxs("div", { className: "table-loading-shell", children: [_jsxs("div", { className: "table-loading-toolbar", children: [_jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" })] }), _jsx(SkeletonTable, { columns: visibleColumns.length + 2, rows: 5 })] }) : requests.error ? _jsx("p", { className: "state error", children: requests.error.message }) : _jsxs(_Fragment, { children: [_jsx(RequestTable, { rows: requests.data?.data ?? [], actions: actions, sort: filters.sort, direction: filters.direction, onSort: sortBy, visibleColumns: visibleColumns, emptyAction: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "secondary-button", onClick: () => void requests.refetch(), children: "Refresh" }), _jsx("button", { type: "button", className: "secondary-button", onClick: () => setFilters(defaultRequestFilters), children: "Clear filters" })] }) }), _jsx(Pagination, { page: requests.data, onPageChange: page => setFilters(value => ({ ...value, page })) })] }) })] }), selected && _jsx(MidmileActionDialog, { selection: selected, busy: transition.isPending, error: transition.error?.message, onClose: () => setSelected(null), onSubmit: payload => transition.mutate({ ...selected, payload }) })] });
}
function MidmileActionDialog({ selection, busy, error, onClose, onSubmit }) {
    const confirming = selection.action === 'assign-truck';
    function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit(confirming ? { plate_number: data.get('plate_number'), truck_size: data.get('truck_size'), truck_type: data.get('truck_type'), provide_time: data.get('provide_time') || null } : { rejection_remarks: data.get('rejection_remarks') });
    }
    return _jsxs(Modal, { open: true, onClose: onClose, className: "form-dialog compact", role: "dialog", ariaLabelledBy: "action-title", children: [_jsxs("div", { className: "dialog-head", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: selection.request.cluster }), _jsx("h2", { id: "action-title", children: confirming ? 'Assign truck' : 'Reject request' })] }), _jsx("button", { className: "icon-button", type: "button", title: "Close", "aria-label": "Close", onClick: onClose, children: _jsx(X, { size: 19 }) })] }), _jsxs("form", { onSubmit: submit, children: [confirming ? _jsxs(_Fragment, { children: [_jsxs("label", { children: ["Plate number", _jsx("input", { name: "plate_number", required: true, autoFocus: true, maxLength: 30 })] }), _jsxs("label", { children: ["Truck size", _jsxs("select", { name: "truck_size", defaultValue: selection.request.truck_size, children: [_jsx("option", { children: "4W" }), _jsx("option", { children: "6W" }), _jsx("option", { children: "10W" }), _jsx("option", { children: "6WF" })] })] }), _jsxs("label", { children: ["Truck type", _jsxs("select", { name: "truck_type", defaultValue: selection.request.truck_type, children: [_jsx("option", { children: "WETLEASE" }), _jsx("option", { children: "DRYLEASE" })] })] }), _jsxs("label", { children: ["Provide time", _jsx("input", { name: "provide_time", type: "datetime-local" })] })] }) : _jsxs("label", { children: ["Rejection remarks", _jsx("textarea", { name: "rejection_remarks", required: true, rows: 4, autoFocus: true })] }), error && _jsx("p", { className: "error notice", children: error }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { className: "secondary-button", type: "button", onClick: onClose, children: "Cancel" }), _jsx("button", { disabled: busy, children: busy ? 'Saving...' : confirming ? _jsxs(_Fragment, { children: [_jsx(Truck, { size: 17 }), "Assign truck"] }) : 'Reject request' })] })] })] });
}
