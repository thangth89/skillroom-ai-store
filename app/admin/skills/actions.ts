"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminClient,
  getSkillStorageBucket,
  hasAdminDataConfig,
  requireAdmin,
} from "@/lib/supabase/admin";
import type { SkillStatus } from "@/lib/supabase/skill-records";

export type SkillActionState = {
  error: string;
};

export type SkillOrderActionState = {
  error: string;
  success: string;
  savedIds: string[] | null;
};

type ParsedSkill = {
  slug: string;
  name: string;
  eyebrow: string;
  short_description: string;
  description: string;
  price: number;
  category: string;
  version: string;
  status: SkillStatus;
  video_url: string | null;
  accent: string;
  accent_soft: string;
  featured: boolean;
  deliverables: string[];
  outcomes: string[];
  requirements: string[];
};

const statuses = new Set<SkillStatus>(["draft", "published", "archived"]);
const allowedFileExtensions = new Set(["skill", "zip", "md", "txt", "json"]);
const maxFileSize = 4 * 1024 * 1024;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getList(formData: FormData, key: string) {
  return getText(formData, key)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSkill(formData: FormData):
  | { data: ParsedSkill; error: "" }
  | { data: null; error: string } {
  const name = getText(formData, "name");
  const slug = getText(formData, "slug").toLowerCase();
  const category = getText(formData, "category");
  const version = getText(formData, "version");
  const eyebrow = getText(formData, "eyebrow");
  const shortDescription = getText(formData, "short_description");
  const description = getText(formData, "description");
  const priceText = getText(formData, "price").replace(/[^0-9]/g, "");
  const price = Number(priceText);
  const statusValue = getText(formData, "status") as SkillStatus;
  const videoValue = getText(formData, "video_url");
  const accent = getText(formData, "accent") || "#b8ff6a";
  const accentSoft = getText(formData, "accent_soft") || "#19351e";

  if (!name || name.length > 120) {
    return { data: null, error: "Tên Skill là bắt buộc và tối đa 120 ký tự." };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      data: null,
      error: "Đường dẫn chỉ dùng chữ thường không dấu, số và dấu gạch ngang.",
    };
  }

  if (!category || !version || !shortDescription || !description) {
    return {
      data: null,
      error: "Vui lòng nhập đầy đủ nhóm, phiên bản và phần mô tả Skill.",
    };
  }

  if (!Number.isSafeInteger(price) || price < 0) {
    return { data: null, error: "Giá bán phải là số nguyên không âm." };
  }

  if (!statuses.has(statusValue)) {
    return { data: null, error: "Trạng thái Skill không hợp lệ." };
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(accent) || !/^#[0-9a-fA-F]{6}$/.test(accentSoft)) {
    return { data: null, error: "Màu giao diện phải ở dạng mã HEX, ví dụ #b8ff6a." };
  }

  let videoUrl: string | null = null;
  if (videoValue) {
    try {
      const parsedUrl = new URL(videoValue);
      if (parsedUrl.protocol !== "https:") throw new Error("invalid protocol");
      videoUrl = parsedUrl.toString();
    } catch {
      return { data: null, error: "URL video phải là đường dẫn HTTPS hợp lệ." };
    }
  }

  if (statusValue === "published" && !videoUrl) {
    return {
      data: null,
      error: "Hãy thêm URL video thành phẩm trước khi chuyển sang trạng thái Đang bán.",
    };
  }

  return {
    data: {
      slug,
      name,
      eyebrow,
      short_description: shortDescription,
      description,
      price,
      category,
      version,
      status: statusValue,
      video_url: videoUrl,
      accent,
      accent_soft: accentSoft,
      featured: formData.get("featured") === "on",
      deliverables: getList(formData, "deliverables"),
      outcomes: getList(formData, "outcomes"),
      requirements: getList(formData, "requirements"),
    },
    error: "",
  };
}

function getUpload(formData: FormData) {
  const value = formData.get("skill_file");
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

function validateUpload(file: File | null) {
  if (!file) return "";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!allowedFileExtensions.has(extension)) {
    return "File Skill chỉ chấp nhận .skill, .zip, .md, .txt hoặc .json.";
  }

  if (file.size > maxFileSize) {
    return "File Skill không được lớn hơn 4 MB.";
  }

  return "";
}

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

async function uploadSkillFile(slug: string, file: File) {
  const supabase = createAdminClient();
  const bucket = getSkillStorageBucket();
  const path = `${slug}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  return { path, error };
}

function dataErrorMessage(message: string, code?: string) {
  if (code === "23505" || message.toLowerCase().includes("duplicate")) {
    return "Đường dẫn này đã được một Skill khác sử dụng.";
  }
  return `Không thể lưu Skill: ${message}`;
}

function isMissingSortOrderError(error: { code?: string; message: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST202" ||
    error.code === "PGRST204" ||
    error.message.toLowerCase().includes("sort_order") ||
    error.message.toLowerCase().includes("reorder_skills")
  );
}

async function getNextSortOrder() {
  const { data, error } = await createAdminClient()
    .from("skills")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (isMissingSortOrderError(error)) return { sortOrder: null, error: null };
  if (error) return { sortOrder: null, error };
  return { sortOrder: (data?.sort_order ?? -1) + 1, error: null };
}

export async function createSkill(
  _previousState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  await requireAdmin();

  if (!hasAdminDataConfig()) {
    return { error: "Thiếu SUPABASE_SECRET_KEY hoặc SKILL_STORAGE_BUCKET trên Vercel." };
  }

  const parsed = parseSkill(formData);
  if (!parsed.data) return { error: parsed.error };

  const upload = getUpload(formData);
  const uploadError = validateUpload(upload);
  if (uploadError) return { error: uploadError };

  if (parsed.data.status === "published" && !upload) {
    return { error: "Hãy tải file Skill lên trước khi chuyển sang trạng thái Đang bán." };
  }

  let filePath: string | null = null;
  if (upload) {
    const result = await uploadSkillFile(parsed.data.slug, upload);
    if (result.error) return { error: `Không thể tải file lên: ${result.error.message}` };
    filePath = result.path;
  }

  const supabase = createAdminClient();
  const nextOrder = await getNextSortOrder();
  if (nextOrder.error) {
    if (filePath) await supabase.storage.from(getSkillStorageBucket()).remove([filePath]);
    return { error: `Không thể xác định vị trí Skill: ${nextOrder.error.message}` };
  }

  const insertData: ParsedSkill & { file_path: string | null; sort_order?: number } = {
    ...parsed.data,
    file_path: filePath,
  };
  if (nextOrder.sortOrder !== null) insertData.sort_order = nextOrder.sortOrder;

  const { data, error } = await supabase
    .from("skills")
    .insert(insertData)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    if (filePath) await supabase.storage.from(getSkillStorageBucket()).remove([filePath]);
    return { error: dataErrorMessage(error?.message ?? "Lỗi không xác định", error?.code) };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/skills");
  revalidatePath("/");
  revalidatePath("/skills");
  revalidatePath(`/skills/${parsed.data.slug}`);
  revalidatePath(`/checkout/${parsed.data.slug}`);
  redirect(`/admin/skills/${data.id}?created=1`);
}

export async function updateSkill(
  _previousState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  await requireAdmin();

  if (!hasAdminDataConfig()) {
    return { error: "Thiếu SUPABASE_SECRET_KEY hoặc SKILL_STORAGE_BUCKET trên Vercel." };
  }

  const id = getText(formData, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Mã Skill không hợp lệ." };

  const parsed = parseSkill(formData);
  if (!parsed.data) return { error: parsed.error };

  const upload = getUpload(formData);
  const uploadError = validateUpload(upload);
  if (uploadError) return { error: uploadError };

  const supabase = createAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("skills")
    .select("file_path, slug")
    .eq("id", id)
    .maybeSingle<{ file_path: string | null; slug: string }>();

  if (currentError || !current) return { error: "Không tìm thấy Skill cần cập nhật." };

  if (parsed.data.status === "published" && !upload && !current.file_path) {
    return { error: "Hãy tải file Skill lên trước khi chuyển sang trạng thái Đang bán." };
  }

  let nextFilePath = current.file_path;
  if (upload) {
    const result = await uploadSkillFile(parsed.data.slug, upload);
    if (result.error) return { error: `Không thể tải file lên: ${result.error.message}` };
    nextFilePath = result.path;
  }

  const { error } = await supabase
    .from("skills")
    .update({ ...parsed.data, file_path: nextFilePath })
    .eq("id", id);

  if (error) {
    if (upload && nextFilePath) {
      await supabase.storage.from(getSkillStorageBucket()).remove([nextFilePath]);
    }
    return { error: dataErrorMessage(error.message, error.code) };
  }

  if (upload && current.file_path && current.file_path !== nextFilePath) {
    await supabase.storage.from(getSkillStorageBucket()).remove([current.file_path]);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/skills");
  revalidatePath(`/admin/skills/${id}`);
  revalidatePath("/");
  revalidatePath("/skills");
  revalidatePath(`/skills/${current.slug}`);
  revalidatePath(`/skills/${parsed.data.slug}`);
  revalidatePath(`/checkout/${current.slug}`);
  revalidatePath(`/checkout/${parsed.data.slug}`);
  redirect(`/admin/skills/${id}?saved=1`);
}

export async function reorderSkills(
  _previousState: SkillOrderActionState,
  formData: FormData,
): Promise<SkillOrderActionState> {
  await requireAdmin();

  if (!hasAdminDataConfig()) {
    return {
      error: "Thiếu cấu hình Supabase trên Vercel.",
      success: "",
      savedIds: null,
    };
  }

  let ids: string[];
  try {
    const parsed = JSON.parse(getText(formData, "skill_ids"));
    ids = Array.isArray(parsed) ? parsed : [];
  } catch {
    ids = [];
  }

  const validIds =
    ids.length > 0 &&
    ids.length <= 500 &&
    ids.every((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)) &&
    new Set(ids).size === ids.length;

  if (!validIds) {
    return {
      error: "Danh sách thứ tự Skill không hợp lệ. Hãy tải lại trang và thử lại.",
      success: "",
      savedIds: null,
    };
  }

  const { error } = await createAdminClient().rpc("reorder_skills", {
    skill_ids: ids,
  });

  if (error) {
    return {
      error: isMissingSortOrderError(error)
        ? "Chưa kích hoạt chức năng sắp xếp trên Supabase. Hãy chạy migration 202608060002_skill_sort_order.sql."
        : `Không thể lưu thứ tự Skill: ${error.message}`,
      success: "",
      savedIds: null,
    };
  }

  revalidatePath("/admin/skills");
  revalidatePath("/");
  revalidatePath("/skills");

  return {
    error: "",
    success: "Đã lưu thứ tự mới và áp dụng ngoài cửa hàng.",
    savedIds: ids,
  };
}
