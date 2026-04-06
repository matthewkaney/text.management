export const searchStyles = {
    ".cm-search": {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "var(--s-0-5)",
        backgroundColor: "var(--color-background)",
    },
    ".cm-panel.cm-search": {
        padding: "2px var(--s-2)",
    },

    ".cm-search input, .cm-search button, .cm-search label": {
        fontFamily: "inherit",
        fontSize: "inherit",
    },
    ".cm-search input[type=text]": {
        backgroundColor: "var(--color-ui-background)",
        color: "var(--color-foreground)",
        border: "1px solid var(--color-ui-background)",
        borderRadius: "2px",
        padding: "0 var(--s-0-5)",
        fontSize: "var(--font-small)",
    },
    ".cm-search button": {
        backgroundColor: "transparent",
        color: "var(--color-foreground)",
        borderRadius: "2px",
        cursor: "pointer",
        fontSize: "var(--font-small)",
    },
    ".cm-search button:hover": {
        backgroundColor: "var(--color-ui-background)",
    },

    ".cm-button[name=prev]": {
        fontSize: "0",
        width: "30px",
    },
    ".cm-button[name=prev]::after": {
        content: '"↑"',
        fontSize: "var(--font-small)",
    },
    ".cm-button[name=next]": {
        fontSize: "0",
        width: "30px",
    },
    ".cm-button[name=next]::after": {
        content: '"↓"',
        fontSize: "var(--font-small)",
    },
    ".cm-search label": {
        height: "24px",
        width: "40px",
    },
    // Match case
    ".cm-search label:has(> input[name=case])": { fontSize: "0" },
    ".cm-search label:has(> input[name=case])::after": {
        content: '"Aa"',
        fontSize: "var(--font-small)",
        color: "var(--color-foreground)",
        width: "24px",
        height: "24px",
        marginLeft: "4px",
    },

    // By word
    ".cm-search label:has(> input[name=word])": { fontSize: "0" },
    ".cm-search label:has(> input[name=word])::after": {
        content: '"ab"',
        fontSize: "var(--font-small)",
        textDecoration: "underline",
        color: "var(--color-foreground)",
        width: "24px",
        height: "24px",
        marginLeft: "4px",
    },

    // Regex
    ".cm-search label:has(> input[name=re])": { fontSize: "0" },
    ".cm-search label:has(> input[name=re])::after": {
        content: '".*"',
        fontSize: "var(--font-small)",
        color: "var(--color-foreground)",
        width: "24px",
        height: "24px",
        marginLeft: "4px",
    },
};