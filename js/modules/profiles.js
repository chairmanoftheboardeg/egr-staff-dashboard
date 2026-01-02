export async function renderProfile({ ctx }) {
  const perms = [...ctx.perms].sort();

  return `
    <div class="row">
      <div class="card" style="flex:1;">
        <div style="font-weight:800; margin-bottom:10px;">Staff Profile</div>

        <div class="small">Full name</div>
        <div style="margin-bottom:10px;">${ctx.staff.full_name}</div>

        <div class="small">Department</div>
        <div style="margin-bottom:10px;">${ctx.staff.department_code}</div>

        <div class="small">Role ID</div>
        <div style="margin-bottom:10px;">${ctx.staff.role_id}</div>

        <div class="small">Status</div>
        <div>${ctx.staff.status}</div>
      </div>

      <div class="card" style="flex:1;">
        <div style="font-weight:800; margin-bottom:10px;">Permissions</div>
        <div class="small" style="margin-bottom:10px;">This controls which modules appear.</div>

        <div style="max-height:280px; overflow:auto; border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:10px;">
          ${perms.map(p => `<div class="small" style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,.06);">${p}</div>`).join("")}
        </div>
      </div>
    </div>
  `;
}
