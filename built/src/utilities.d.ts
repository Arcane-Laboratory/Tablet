declare const nowString: () => string;
interface summaryEntry {
    value: string | number | boolean;
    verboseOnly?: boolean;
}
interface summary {
    [key: string]: summaryEntry;
    ERRORS: {
        value: number;
        verboseOnly: false;
    };
}
interface tableSummary extends summary {
    [key: string]: summaryEntry;
    ERRORS: {
        value: number;
        verboseOnly: false;
    };
    CREATIONS: {
        value: number;
        verboseOnly: boolean;
    };
    READS: {
        value: number;
        verboseOnly: boolean;
    };
    UPDATES: {
        value: number;
        verboseOnly: boolean;
    };
    DELETIONS: {
        value: number;
        verboseOnly: boolean;
    };
}
export { nowString, summary, summaryEntry, tableSummary };
//# sourceMappingURL=utilities.d.ts.map