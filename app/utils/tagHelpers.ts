import { Media, Tag } from "@/constants/types";

export const responseToTag = (input: any): Tag => {
    const x: Tag = {
        id: input.id,
        title: decodeURIComponent(input.Title),
        altTitle: decodeURIComponent(input.AltTitle),
        writKey: input.WritKey,
        parts: input.Parts,
        lyrics: decodeURIComponent(input.Lyrics),
        rating: input.Rating,
        ratingCount: input.RatingCount,
        downloaded: input.Downloaded,
        sheetMusic: mediaElementToMedia(input.SheetMusic),
        sheetMusicAlt: mediaElementToMedia(input.SheetMusicAlt),
        allParts: mediaElementToMedia(input.AllParts),
        bass: mediaElementToMedia(input.Bass),
        bari: mediaElementToMedia(input.Bari),
        lead: mediaElementToMedia(input.Lead),
        tenor: mediaElementToMedia(input.Tenor),
    };
    return x;
};

const mediaElementToMedia = (element: any): Media => {
    return { type: element?.["@_type"], source: element?.["#text"] };
};
