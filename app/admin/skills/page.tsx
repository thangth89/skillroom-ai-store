import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { formatVnd } from "@/lib/format";
import { skills } from "@/lib/skills";

export default function AdminSkillsPage() { return <AdminShell eyebrow="NỘI DUNG" title="Quản lý Skill"><section className="admin-panel"><div className="panel-heading"><div><span>{skills.length} SẢN PHẨM</span><h2>Danh sách Skill</h2></div><button className="primary-button">+ Thêm Skill</button></div><div className="admin-table"><div className="table-row table-head"><span>Sản phẩm</span><span>Nhóm</span><span>Giá</span><span>Trạng thái</span></div>{skills.map((skill) => <div className="table-row" key={skill.slug}><span><strong>{skill.name}</strong><small>{skill.version}</small></span><span>{skill.category}</span><span>{formatVnd(skill.price)}</span><span><i>Đang bán</i><Link href={`/skills/${skill.slug}`}>Xem ↗</Link></span></div>)}</div></section></AdminShell>; }
