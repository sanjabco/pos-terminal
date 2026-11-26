import type { LineDetail, MenuSelection } from '../services/api';

export function quoteMenuProduct(line: LineDetail, selection: MenuSelection) {
    const option = line.menuPricing?.option;
    const choice = selection.optionIndex == null ? undefined : option?.choices[selection.optionIndex];
    const addons = (selection.addonIndexes ?? []).map(index => line.menuPricing?.addons[index]);
    if ((option && !choice) || (selection.optionIndex != null && !choice) || addons.some(addon => !addon)) {
        return null;
    }
    const items = [...(choice ? [choice] : []), ...addons];
    const unitPrice = items.reduce(
        (sum, item) => sum + (item?.specialPrice ?? item?.price ?? 0),
        choice ? 0 : Number(line.fixedPrice),
    );
    if (!Number.isSafeInteger(unitPrice) || unitPrice < 1) return null;
    return { unitPrice, choiceTitles: items.map(item => item!.title) };
}
