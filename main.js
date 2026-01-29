const API_BASE = "http://localhost:3000";

function toTrimmedString(value) {
    return String(value ?? "").trim();
}

function toNumberOrString(value) {
    const trimmed = toTrimmedString(value);
    if (trimmed === "") return "";
    const asNumber = Number(trimmed);
    return Number.isFinite(asNumber) ? asNumber : trimmed;
}

function computeNextIdString(items) {
    let maxId = 0;
    for (const item of items) {
        const n = Number.parseInt(String(item?.id ?? ""), 10);
        if (Number.isFinite(n)) maxId = Math.max(maxId, n);
    }
    return String(maxId + 1);
}

async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    return { res, json };
}

// POSTS (soft delete)
async function loadPosts() {
    try {
        const { res, json: posts } = await fetchJson(`${API_BASE}/posts`);
        if (!res.ok) throw new Error("Failed to load posts");

        const body = document.getElementById("posts-table-body");
        body.innerHTML = "";

        for (const post of posts) {
            const isDeleted = post.isDeleted === true;
            body.innerHTML += `
            <tr class="${isDeleted ? "deleted" : ""}">
                <td>${post.id ?? ""}</td>
                <td>${post.title ?? ""}</td>
                <td>${post.views ?? ""}</td>
                <td>
                    <input value="Edit" type="button" onclick="editPost('${post.id}')" />
                    <input value="Delete" type="button" onclick="softDeletePost('${post.id}')" ${isDeleted ? "disabled" : ""} />
                </td>
            </tr>`;
        }
    } catch (error) {
        console.error(error);
    }
}

async function savePost() {
    const id = toTrimmedString(document.getElementById("post_id_txt").value);
    const title = toTrimmedString(document.getElementById("post_title_txt").value);
    const views = toNumberOrString(document.getElementById("post_views_txt").value);

    try {
        let res;

        if (id) {
            const getExisting = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`);
            if (getExisting.ok) {
                res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, views }),
                });
            } else {
                res = await fetch(`${API_BASE}/posts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: String(id), title, views, isDeleted: false }),
                });
            }
        } else {
            const { res: listRes, json: posts } = await fetchJson(`${API_BASE}/posts`);
            if (!listRes.ok) throw new Error("Failed to load posts for ID generation");

            const newId = computeNextIdString(posts);
            res = await fetch(`${API_BASE}/posts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: newId, title, views, isDeleted: false }),
            });
        }

        if (!res.ok) throw new Error("Failed to save post");
        clearPostForm();
        await loadPosts();
    } catch (error) {
        console.error(error);
    }
}

async function softDeletePost(id) {
    const safeId = toTrimmedString(id);
    if (!safeId) return;

    try {
        const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(safeId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDeleted: true }),
        });
        if (!res.ok) throw new Error("Failed to soft delete post");
        await loadPosts();
    } catch (error) {
        console.error(error);
    }
}

async function editPost(id) {
    const safeId = toTrimmedString(id);
    if (!safeId) return;
    try {
        const { res, json: post } = await fetchJson(`${API_BASE}/posts/${encodeURIComponent(safeId)}`);
        if (!res.ok) throw new Error("Failed to load post");

        document.getElementById("post_id_txt").value = post.id ?? "";
        document.getElementById("post_title_txt").value = post.title ?? "";
        document.getElementById("post_views_txt").value = post.views ?? "";
    } catch (error) {
        console.error(error);
    }
}

function clearPostForm() {
    document.getElementById("post_id_txt").value = "";
    document.getElementById("post_title_txt").value = "";
    document.getElementById("post_views_txt").value = "";
}

// COMMENTS (full CRUD)
async function loadComments() {
    try {
        const { res, json: comments } = await fetchJson(`${API_BASE}/comments`);
        if (!res.ok) throw new Error("Failed to load comments");

        const body = document.getElementById("comments-table-body");
        body.innerHTML = "";
        for (const comment of comments) {
            body.innerHTML += `
            <tr>
                <td>${comment.id ?? ""}</td>
                <td>${comment.text ?? ""}</td>
                <td>${comment.postId ?? ""}</td>
                <td>
                    <input value="Edit" type="button" onclick="editComment('${comment.id}')" />
                    <input value="Delete" type="button" onclick="deleteComment('${comment.id}')" />
                </td>
            </tr>`;
        }
    } catch (error) {
        console.error(error);
    }
}

async function saveComment() {
    const id = toTrimmedString(document.getElementById("comment_id_txt").value);
    const text = toTrimmedString(document.getElementById("comment_text_txt").value);
    const postId = toTrimmedString(document.getElementById("comment_postId_txt").value);

    try {
        let res;
        if (id) {
            const getExisting = await fetch(`${API_BASE}/comments/${encodeURIComponent(id)}`);
            if (getExisting.ok) {
                res = await fetch(`${API_BASE}/comments/${encodeURIComponent(id)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, postId }),
                });
            } else {
                res = await fetch(`${API_BASE}/comments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: String(id), text, postId }),
                });
            }
        } else {
            const { res: listRes, json: comments } = await fetchJson(`${API_BASE}/comments`);
            if (!listRes.ok) throw new Error("Failed to load comments for ID generation");

            const newId = computeNextIdString(comments);
            res = await fetch(`${API_BASE}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: newId, text, postId }),
            });
        }

        if (!res.ok) throw new Error("Failed to save comment");
        clearCommentForm();
        await loadComments();
    } catch (error) {
        console.error(error);
    }
}

async function editComment(id) {
    const safeId = toTrimmedString(id);
    if (!safeId) return;
    try {
        const { res, json: comment } = await fetchJson(`${API_BASE}/comments/${encodeURIComponent(safeId)}`);
        if (!res.ok) throw new Error("Failed to load comment");

        document.getElementById("comment_id_txt").value = comment.id ?? "";
        document.getElementById("comment_text_txt").value = comment.text ?? "";
        document.getElementById("comment_postId_txt").value = comment.postId ?? "";
    } catch (error) {
        console.error(error);
    }
}

async function deleteComment(id) {
    const safeId = toTrimmedString(id);
    if (!safeId) return;

    try {
        const res = await fetch(`${API_BASE}/comments/${encodeURIComponent(safeId)}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete comment");
        await loadComments();
    } catch (error) {
        console.error(error);
    }
}

function clearCommentForm() {
    document.getElementById("comment_id_txt").value = "";
    document.getElementById("comment_text_txt").value = "";
    document.getElementById("comment_postId_txt").value = "";
}

window.addEventListener("DOMContentLoaded", () => {
    loadPosts();
    loadComments();
});
