import {  Plugin, TFile, Notice } from 'obsidian';
import { getTagFilesMap, randomElement } from './utilities';
import { RandomWalkNoteSettingTab } from './settingTab';
import {  RandomWalkNoteSettings } from './types';

const alreadyOpen : string[] = [];

export default class RandomWalkNotePlugin extends Plugin {
    settings: RandomWalkNoteSettings = { openInNewLeaf: true, enableRibbonIcon: true, selectedTag: '', excludedFolders: '' };
    ribbonIconEl: HTMLElement | undefined = undefined;

    async onload(): Promise<void> {
        await this.loadSettings();

        this.addSettingTab(new RandomWalkNoteSettingTab(this));

        this.addCommand({
            id: 'random-walk-note',
            name: 'Random walk note',
            callback: this.handleOpenRandomNote,
        });

    }

    onunload = (): void => {
    };

    handleOpenRandomNote = async (): Promise<void> => {
        const excludedFolders = this.settings.excludedFolders.split(',').map(x => x.trim()).filter(x => x !== '');
        const markdownFiles = this.app.vault.getMarkdownFiles().filter(x => excludedFolders.every(folder => !x.path.contains(folder)));
        await this.openRandomNote(markdownFiles);
    };

    openRandomNote = async (files: TFile[]): Promise<void> => {
        const markdownFiles = files.filter((file) => file.extension === 'md');

        const filteredFolders= this.filterExcludedFolders(markdownFiles)
        const filteredTags= this.filterTag(filteredFolders)

        if (!filteredTags.length) {
            new Notice("Can't open note. No markdown files available to open.", 5000);
            return;
        }

        let fileToOpen = randomElement(filteredTags);

        if (alreadyOpen.includes(fileToOpen.name)) {
          new Notice('Already: ' + fileToOpen.name);
          fileToOpen = randomElement(filteredTags);
        } else {
          alreadyOpen.push(fileToOpen.name);
        }

        if (alreadyOpen.length == filteredTags.length) {
          alreadyOpen.length = 0;
        }
        new Notice('Open: ' + fileToOpen.name + '; Count: ' + alreadyOpen.length);
        await this.app.workspace.openLinkText(fileToOpen.basename, '', this.settings.openInNewLeaf, {
            active: true,
        });
    };

    filterExcludedFolders(files: TFile[]) {
        const excludedFolders = this.settings.excludedFolders.split(',').map(x => x.trim()).filter(x => x !== '');
        return files.filter(x => excludedFolders.every(folder => !x.path.contains(folder)));
    }

    filterTag(files: TFile[]) {
        const tag = this.settings.selectedTag;
        if(tag == '')
            return files;

        const tagFilesMap = getTagFilesMap(this.app);
        const taggedFiles = tagFilesMap[tag];
        const result = files.filter(x => taggedFiles.some(f => f.path == x.path));
        return result;
    }

    loadSettings = async (): Promise<void> => {
        const loadedSettings = (await this.loadData()) as RandomWalkNoteSettings;
        if (loadedSettings) {
            this.setOpenInNewLeaf(loadedSettings.openInNewLeaf);
            this.setEnableRibbonIcon(loadedSettings.enableRibbonIcon);
            this.settings.excludedFolders = loadedSettings.excludedFolders;
            this.settings.selectedTag = loadedSettings.selectedTag;
        } else {
            this.refreshRibbonIcon();
        }
        this.saveSettings()
    };

    setOpenInNewLeaf = (value: boolean): void => {
        this.settings.openInNewLeaf = value;
        this.saveData(this.settings);
    };

    setEnableRibbonIcon = (value: boolean): void => {
        this.settings.enableRibbonIcon = value;
        this.refreshRibbonIcon();
        this.saveData(this.settings);
    };

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // https://lucide.dev/icons/
    refreshRibbonIcon = (): void => {
        this.ribbonIconEl?.remove();
        if (this.settings.enableRibbonIcon) {
            this.ribbonIconEl = this.addRibbonIcon(
                'footprints',
                'Random walk note',
                this.handleOpenRandomNote,
            );
        }
    };
}
