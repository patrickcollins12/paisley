import { DateTime } from "luxon";

// ✅ Verified unchanged data transformation logic
export function turnTransactionQueryIntoTreemapStucture(rows, incomeEnabled, expenseEnabled) {
    return rows.reduce((tree, row) => {
        processRow(row, tree, incomeEnabled, expenseEnabled);
        return tree;
    }, []);
}

function processRow(row, tree, incomeEnabled, expenseEnabled) {
    row.tags = row.tags?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
    if (row.tags.length === 0) row.tags.push("Uncategorized");

    row.party = row.party?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
    if (row.party.length === 0) row.party.push("Uncategorized");

    // Skip this transaction if it's income and income is disabled, or if it's an expense and expenses are disabled
    const isIncome = parseFloat(row.amount) > 0;
    if ((isIncome && !incomeEnabled) || (!isIncome && !expenseEnabled)) {
        return;
    }

    const node = {
        credit: parseFloat(row.credit) || 0,
        debit: parseFloat(row.debit) || 0,
        amount: parseFloat(row.amount) || 0,
        value: Math.abs(parseFloat(row.amount)) || 0.0,
        description: row.description,
        account_shortname: row.account_shortname,
        account_currency: row.account_currency,
        account_number: row.account_number,
        datetime: DateTime.fromISO(row.datetime),
        date: DateTime.fromISO(row.datetime_without_timezone).toFormat("yyyy-MM-dd"),
    };

    node.tagsString = row.tags?.join(", ");
    node.partyString = row.party?.join(", ");

    node.path = `${node.description}`;
    node.name = (node.partyString !== "Uncategorized") ? node.partyString : node.description;

    const tag = row.tags[0];
    const segments = tag.split(/\s*>\s*/);

    // prepend Income/Expense to the tag
    // if (incomeEnabled && expenseEnabled) {
        if (node.amount > 0) {
            segments.unshift("Income");
        } else {
            segments.unshift("Expense");
        }
    // }

    autovivifyTree(tree, segments, node);
}

function autovivifyTree(root, pathSegments, newNode) {
    let currentLevel = root;

    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const fullPath = pathSegments.slice(0, i + 1).join(" / ");

        let node = currentLevel.find((node) => node.path === fullPath);
        if (!node) {
            node = { path: fullPath, name: segment, children: [] };
            currentLevel.push(node);
        }

        currentLevel = node.children;
    }

    currentLevel.push(newNode);
} 