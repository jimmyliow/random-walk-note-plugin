import {  Plugin, TFile, Notice, addIcon } from 'obsidian';
import { getTagFilesMap, randomElement } from './utilities';
import { RandomWalkNoteSettingTab } from './settingTab';
import {  RandomWalkNoteSettings } from './types';

const alreadyOpen : string[] = [];

export default class RandomWalkNotePlugin extends Plugin {
    settings: RandomWalkNoteSettings = { openInNewLeaf: true, enableRibbonIcon: true, selectedTag: '', excludedFolders: '' };
    ribbonIconEl: HTMLElement | undefined = undefined;

    async onload(): Promise<void> {
      // 文档：https://docs.obsidian.md/Plugins/User+interface/Icons
      // 参考自定义图标：
      // https://github.com/RafaelGB/obsidian-db-folder/blob/master/src/helpers/Constants.ts
      // https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/master/src/constants/constants.ts#L396
      addIcon('random-walk-icon', `<g transform="translate(5,5) scale(4,4)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/></g>`);
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
          fileToOpen = randomElement(filteredTags);
        }
        // 如果文件还有重复，再查找两边
        if (alreadyOpen.includes(fileToOpen.name)) {
          fileToOpen = randomElement(filteredTags);
        }
        if (alreadyOpen.includes(fileToOpen.name)) {
          fileToOpen = randomElement(filteredTags);
        }

        if (alreadyOpen.includes(fileToOpen.name)) {
          // 查重三遍后忽略重复
        } else {
          alreadyOpen.push(fileToOpen.name);
        }

        if (alreadyOpen.length == filteredTags.length) {
          alreadyOpen.length = 0;
          new Notice('Already completed all the note reviews');
        }
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
                'random-walk-icon',
                'Random walk note',
                this.handleOpenRandomNote,
            );
        }
    };
}
