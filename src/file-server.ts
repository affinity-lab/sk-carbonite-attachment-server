import type {RequestEvent} from "@sveltejs/kit";
import AttachmentService from "@affinity-lab/carbonite-attachment/src/attachment-service";
import fs from "fs";
import {Attachment} from "@affinity-lab/carbonite-attachment";
import fileFetch from "file-fetch";
import path from "path";
import sharp from "sharp";

export default class FileServer {
	constructor(
		private imgPath: string,
		private fileCacheTTL: number | undefined = undefined,
		private imgCacheTTL: number | undefined = undefined,
		private userProvider: ((event: RequestEvent) => any) = () => true
	) {}

	private async serveFile(filePath: string, cacheTTL: undefined | number = undefined) {
		let file = await fileFetch(filePath);
		if (cacheTTL !== undefined) file.headers["Cache-Control"] = `public, max-age=${cacheTTL}`;
		return new Response(file.body, {headers: file.headers});
	}

	async file(reqPath: string, event: RequestEvent) {
		let [idb36, name] = (reqPath.split('/'));
		let id = parseInt(idb36, 36)

		let filePath = AttachmentService.instance.fullPath({id, name, isGuarded: true})

		if (!fs.existsSync(filePath)) {
			filePath = AttachmentService.instance.fullPath({id, name, isGuarded: false})
			if (!fs.existsSync(filePath)) return new Response("not found", {status: 404});
			let attachment = await Attachment.pick(id);
			if (attachment !== null && name === attachment.name && attachment.isGuarded && await attachment.guard(attachment, this.userProvider(event))) {
				return new Response("not found", {status: 403});
			}
		}
		return this.serveFile(filePath, this.fileCacheTTL);
	}

	async img(reqPath: string, event: RequestEvent) {
		let filePath = path.resolve(this.imgPath, reqPath.replaceAll("/", "-"));
		if (!fs.existsSync(filePath)) {
			let [idb36, ver, dim, name] = (reqPath.split('/'));
			let id = parseInt(idb36, 36)
			let attachment = await Attachment.pick(id);
			if (attachment !== null && attachment.name === name) {
				let [width, height] = dim.split("x");
				await sharp(attachment.fullPath, {animated: true})
					.resize(parseInt(width), parseInt(height), {
						kernel: sharp.kernel.lanczos3,
						fit: 'cover',
						position: attachment.image?.focus ?? 'centre',
						withoutEnlargement: true,
					})
					.toFile(filePath);
			} else {
				return new Response("not found", {status: 404})
			}
		}
		return this.serveFile(filePath, this.imgCacheTTL);
	}

}