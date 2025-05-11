export type Media = {
    type?: string;
    source: string;
};

export interface Tag {
    id: number;
    title: string;
    altTitle: string;
    writKey: string;
    parts: number;
    lyrics: string;
    rating: number;
    ratingCount: number;
    downloaded: number;
    sheetMusic: Media;
    sheetMusicAlt?: Media;
    allParts?: Media;
    bass?: Media;
    bari?: Media;
    lead?: Media;
    tenor?: Media;
}
