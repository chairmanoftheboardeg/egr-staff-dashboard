export async function renderTickets({ supabase, ctx }) {
  // This assumes your tickets table has: id, subject, status, department_code, assigned_to_user_id, created_at
  // Ticket routing by department is part of your requirements. :contentReference[oaicite:3]{index=3}

  const dept = ctx.staff.department_code;

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id, subject, status, department_code, assigned_to_user_id, created_at")
    .eq("department_code", dept)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return `Tickets load failed: ${error.message}`;
  }

  const rows = (tickets ?? []).map(t => {
    const claimed = !!t.assigned_to_user_id;
    const canClaim = !claimed && (t.status === "open" || t.status === "new" || t.status === "submitted");
    return `
      <tr>
        <td>${t.subject ?? "(no subject)"}</td>
        <td>${t.status}</td>
        <td class="small">${new Date(t.created_at).toLocaleString()}</td>
        <td>
          ${claimed ? `<span class="badge">Claimed</span>` : `<span class="badge">Unclaimed</span>`}
        </td>
        <td>
          ${canClaim ? `<button class="btn" data-claim="${t.id}">Claim</button>` : ""}
        </td>
      </tr>
    `;
  }).join("");

  // Render table
  const html = `
    <div class="row" style="margin-bottom:12px;">
      <div class="badge">Department queue: ${dept}</div>
      <div class="badge">Total shown: ${(tickets ?? []).length}</div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Status</th>
          <th>Created</th>
          <th>Claim</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" class="small">No tickets found.</td></tr>`}</tbody>
    </table>

    <div class="small" style="margin-top:10px;">
      Next: ticket detail view + two-way chat + close workflow.
    </div>
  `;

  // Attach claim handlers after render
  setTimeout(() => {
    document.querySelectorAll("[data-claim]").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const id = btn.getAttribute("data-claim");

        const { error: updErr } = await supabase
          .from("tickets")
          .update({ assigned_to_user_id: ctx.staff.user_id, status: "in_progress" })
          .eq("id", id)
          .is("assigned_to_user_id", null);

        if (updErr) {
          alert(`Claim failed: ${updErr.message}`);
          btn.disabled = false;
          return;
        }

        window.location.reload();
      });
    });
  }, 0);

  return html;
}
