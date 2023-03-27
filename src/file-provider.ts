type File = {
	id: number,
		name: string,
		size: number,
		title: null | string,
		ver: string,
}

export default class FileProvider {
	constructor(private fsUrlPrefix: string, private imgUrlPrefix: string) {}
	img(file: File, width: number, height: number): Img {return new Img(file, width, height, this.imgUrlPrefix);}
	file(file: File): string {return `${this.fsUrlPrefix}/${idToB36(file.id)}/${file.name}`;}
}


class Img {
	private name: string;
	private format: "webp" | "jpg" | "png" = "webp";
	private res: number = 1;
	constructor(private file: File, private width: number, private height: number, private prefix: string) {
		let name = file.name.split(".");
		name.pop()
		this.name = name.join(".");
	}
	get x1(): this {
		this.res = 1;
		return this;
	}
	get x2(): this {
		this.res = 2;
		return this;
	}
	get x3(): this {
		this.res = 3;
		return this;
	}
	get x4(): this {
		this.res = 4;
		return this;
	}
	get png(): string {
		this.format = "png";
		return this.url();
	}
	get jpg(): string {
		this.format = "jpg";
		return this.url();
	}
	get webp(): string {
		this.format = "webp";
		return this.url();
	}

	private url(): string {return `${this.prefix}/${idToB36(this.file.id)}/${this.file.ver}/${this.width * this.res}x${this.height * this.res}/${this.name}.${this.format}`}
}

function idToB36(id: number): string {return id.toString(36).padStart(6, '0')};
