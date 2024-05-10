import { TFile } from 'obsidian';

export type TagFilesMap = { [tag: string]: TFile[] };

export interface RandomWalkNoteSettings {
    openInNewLeaf: boolean;
    enableRibbonIcon: boolean;
    excludedFolders: string;
    selectedTag: string;
}
