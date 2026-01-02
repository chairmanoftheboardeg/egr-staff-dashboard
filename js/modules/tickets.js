export async function renderTickets({ supabase, ctx }) {
  const dept = ctx.staff.department_code;

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id, subject, status, priority, department_code, claimed_by_user_id, created_at")
    .eq("department_code", dept)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return `Tickets load failed: ${error.message}`;

  const rows = (tickets ?? []).map(t => {
    const claimed = !!t.claimed_by_user_id;
    const canClaim = !claimed && (t.status === "open");

    return `
      <tr>
        <td>${t.subject ?? "(no subject)"}</td>
        <td>${t.status}</td>
        <td>${t.priority ?? "normal"}</td>
        <td class="small">${new Date(t.created_at).toLocaleString()}</td>
        <td>${claimed ? `<span class="badge">Claimed</span>` : `<span class="badge">Unclaimed</span>`}</td>
        <td>${canClaim ? `<button class="btn" data-claim="${t.id}">Claim</button>` : ""}</td>
      </tr>
    `;
  }).join("");

  const html = `
    <div class="row" style="margin-bottom:12px;">
      <div class="badge">Department queue: ${dept}</div>
      <div class="badge">Shown: ${(tickets ?? []).length}</div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Created</th>
          <th>Claim</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="6" class="small">No tickets in this queue.</td></tr>`}</tbody>
    </table>

    <div class="small" style="margin-top:10px;">
      Next: ticket detail view + messages + close workflow.
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll("[data-claim]").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const ticketId = btn.getAttribute("data-claim");

        const { error: claimErr } = await supabase.rpc("claim_ticket", { p_ticket_id: ticketId });
        if (claimErr) {
          alert(`Claim failed: ${claimErr.message}`);
          btn.disabled = false;
          return;
        }

        window.location.reload();
      });
    });
  }, 0);

  return html;
}
