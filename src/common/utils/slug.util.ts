import { ObjectLiteral, Repository } from 'typeorm';

export class SlugUtil {
  static async generateUniqueSlug<T extends ObjectLiteral>(
    baseSlug: string,
    repository: Repository<T>,
  ): Promise<string> {
    let slug = this.slugifyVietnamese(baseSlug);
    let counter = 1;

    while (await repository.exists({ where: { slug } as any, withDeleted: true })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // spaces to -
      .replace(/[^\w\-]+/g, '') // remove special chars
      .replace(/\-\-+/g, '-') // multiple - to single -
      .replace(/^-+|-+$/g, ''); // trim - from start/end
  }

  static slugifyVietnamese(text: string): string {
    const from = 'àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩị';
    const to = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiii';

    let slug = text.toLowerCase();
    for (let i = 0; i < from.length; i++) {
      slug = slug.replace(new RegExp(from[i], 'g'), to[i]);
    }

    return this.slugify(slug);
  }
}
