import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SearchableSelectOption {
	value: string;
	label: string;
	description?: string;
}

export interface SearchableSelectProps {
	options: SearchableSelectOption[];
	value: string | null;
	onChange: (value: string | null) => void;
	label: string;
	placeholder?: string;
	searchPlaceholder?: string;
	required?: boolean;
	disabled?: boolean;
	disabledHint?: string;
	emptyMessage?: string;
	id?: string;
	openDirection?: "down" | "up";
}

function SearchableSelect({
	options,
	value,
	onChange,
	label,
	placeholder = "Seleccionar...",
	searchPlaceholder = "Buscar...",
	required = false,
	disabled = false,
	disabledHint,
	emptyMessage = "No se encontraron resultados.",
	id,
	openDirection = "down",
}: SearchableSelectProps) {
	const generatedId = useId();
	const baseId = id ?? generatedId;
	const inputId = `${baseId}-input`;
	const listboxId = `${baseId}-listbox`;

	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const [panelStyle, setPanelStyle] = useState<{
		left: number;
		width: number;
		maxHeight: number;
		placement: "top" | "bottom";
		/** For "bottom" placement: distance from viewport top to panel top. For "top" placement: distance from viewport bottom to panel bottom. */
		offset: number;
	} | null>(null);

	const triggerRef = useRef<HTMLButtonElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const optionRefs = useRef<Map<number, HTMLLIElement>>(new Map());

	const PANEL_GAP = 6;
	const ESTIMATED_PANEL_HEIGHT = 320;
	const VIEWPORT_MARGIN = 8;

	const selectedOption = useMemo(
		() => options.find((option) => option.value === value) ?? null,
		[options, value]
	);

	const filteredOptions = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) return options;
		return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
	}, [options, query]);

	const updatePanelPosition = useCallback(() => {
		const trigger = triggerRef.current;
		if (!trigger) return;

		const rect = trigger.getBoundingClientRect();
		const viewportHeight = window.innerHeight;
		const panelHeight = panelRef.current?.offsetHeight ?? ESTIMATED_PANEL_HEIGHT;

		const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_MARGIN;
		const spaceAbove = rect.top - VIEWPORT_MARGIN;

		let placement: "top" | "bottom" = openDirection === "up" ? "top" : "bottom";
		if (placement === "bottom" && spaceBelow < panelHeight && spaceAbove > spaceBelow) {
			placement = "top";
		} else if (placement === "top" && spaceAbove < panelHeight && spaceBelow > spaceAbove) {
			placement = "bottom";
		}

		const availableSpace = placement === "top" ? spaceAbove : spaceBelow;
		const maxHeight = Math.max(160, Math.min(ESTIMATED_PANEL_HEIGHT, availableSpace));

		const offset =
			placement === "top"
				? viewportHeight - (rect.top - PANEL_GAP)
				: rect.bottom + PANEL_GAP;

		setPanelStyle({
			left: rect.left,
			width: rect.width,
			maxHeight,
			placement,
			offset,
		});
	}, [openDirection, ESTIMATED_PANEL_HEIGHT, PANEL_GAP, VIEWPORT_MARGIN]);

	const closeAndReset = useCallback(() => {
		setIsOpen(false);
		setQuery("");
		setPanelStyle(null);
	}, []);

	useLayoutEffect(() => {
		if (!isOpen) return;
		// First pass: position using an estimated height before the panel has rendered.
		updatePanelPosition();
		// Second pass: re-measure now that the panel's real height is known (e.g. fewer
		// options than fit the estimate), so "up" placement hugs the trigger precisely.
		const frame = requestAnimationFrame(() => updatePanelPosition());
		return () => cancelAnimationFrame(frame);
	}, [isOpen, updatePanelPosition, filteredOptions.length]);

	useEffect(() => {
		if (!isOpen) return;
		const frame = requestAnimationFrame(() => inputRef.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const isInsideContainer = containerRef.current?.contains(target) ?? false;
			const isInsidePanel = panelRef.current?.contains(target) ?? false;
			if (!isInsideContainer && !isInsidePanel) {
				closeAndReset();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen, closeAndReset]);

	useEffect(() => {
		if (!isOpen) return;

		const handleReposition = () => updatePanelPosition();

		window.addEventListener("resize", handleReposition);
		window.addEventListener("scroll", handleReposition, { capture: true });
		return () => {
			window.removeEventListener("resize", handleReposition);
			window.removeEventListener("scroll", handleReposition, { capture: true });
		};
	}, [isOpen, updatePanelPosition]);

	useEffect(() => {
		if (!isOpen) return;
		const node = optionRefs.current.get(highlightedIndex);
		node?.scrollIntoView({ block: "nearest" });
	}, [highlightedIndex, isOpen]);

	const commitSelection = useCallback(
		(option: SearchableSelectOption) => {
			onChange(option.value);
			closeAndReset();
		},
		[onChange, closeAndReset]
	);

	const handleTriggerClick = useCallback(() => {
		if (disabled) return;
		setIsOpen((prev) => {
			if (prev) {
				setQuery("");
				setPanelStyle(null);
			} else {
				setHighlightedIndex(0);
			}
			return !prev;
		});
	}, [disabled]);

	const handleClear = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();
			onChange(null);
		},
		[onChange]
	);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "ArrowDown") {
				event.preventDefault();
				setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
				return;
			}
			if (event.key === "ArrowUp") {
				event.preventDefault();
				setHighlightedIndex((prev) => Math.max(prev - 1, 0));
				return;
			}
			if (event.key === "Enter") {
				event.preventDefault();
				const option = filteredOptions[highlightedIndex];
				if (option) commitSelection(option);
				return;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				closeAndReset();
				inputRef.current?.blur();
			}
		},
		[filteredOptions, highlightedIndex, commitSelection, closeAndReset]
	);

	return (
		<div className="flex flex-col gap-1.5" ref={containerRef}>
			<label htmlFor={inputId} className="text-sm font-medium text-foreground">
				{label}
				{required && <span className="ml-0.5 text-destructive">*</span>}
			</label>

			<div className="relative">
				<button
					ref={triggerRef}
					type="button"
					onClick={handleTriggerClick}
					disabled={disabled}
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					aria-controls={listboxId}
					className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
						disabled
							? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground"
							: "border-input text-foreground hover:border-primary/50"
					}`}
				>
					<span className={`truncate ${!selectedOption ? "text-muted-foreground" : ""}`}>
						{selectedOption ? selectedOption.label : placeholder}
					</span>
					<span className="flex shrink-0 items-center gap-1">
						{selectedOption && !disabled && (
							<span
								role="button"
								tabIndex={0}
								aria-label={`Limpiar ${label}`}
								onClick={handleClear}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										onChange(null);
									}
								}}
								className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
							>
								<X className="h-3.5 w-3.5" />
							</span>
						)}
						<ChevronDown
							className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
						/>
					</span>
				</button>

				{isOpen &&
					!disabled &&
					createPortal(
						<div
							ref={panelRef}
							className="fixed z-[60] flex flex-col overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
							style={{
								top: panelStyle?.placement === "bottom" ? panelStyle.offset : "auto",
								bottom: panelStyle?.placement === "top" ? panelStyle.offset : "auto",
								left: panelStyle?.left ?? -9999,
								width: panelStyle?.width,
								maxHeight: panelStyle?.maxHeight,
								visibility: panelStyle ? "visible" : "hidden",
							}}
						>
							<div className="flex items-center gap-2 border-b border-border px-3 py-2">
								<Search className="h-4 w-4 shrink-0 text-muted-foreground" />
								<input
									ref={inputRef}
									id={inputId}
									type="text"
									role="combobox"
									aria-expanded={isOpen}
									aria-controls={listboxId}
									aria-autocomplete="list"
									aria-activedescendant={
										filteredOptions[highlightedIndex]
											? `${listboxId}-option-${highlightedIndex}`
											: undefined
									}
									value={query}
									onChange={(event) => {
										setQuery(event.target.value);
										setHighlightedIndex(0);
									}}
									onKeyDown={handleKeyDown}
									placeholder={searchPlaceholder}
									className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
								/>
							</div>

							<ul id={listboxId} role="listbox" className="overflow-y-auto py-1">
								{filteredOptions.length === 0 && (
									<li className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</li>
								)}
								{filteredOptions.map((option, index) => {
									const isSelected = option.value === value;
									const isHighlighted = index === highlightedIndex;

									return (
										<li
											key={option.value}
											id={`${listboxId}-option-${index}`}
											role="option"
											aria-selected={isSelected}
											ref={(node) => {
												if (node) optionRefs.current.set(index, node);
												else optionRefs.current.delete(index);
											}}
											onMouseEnter={() => setHighlightedIndex(index)}
											onClick={() => commitSelection(option)}
											className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${
												isHighlighted ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
											}`}
										>
											<span className="truncate">{option.label}</span>
											{isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
										</li>
									);
								})}
							</ul>
						</div>,
						document.body
					)}
			</div>

			{disabled && disabledHint && <p className="text-xs text-muted-foreground">{disabledHint}</p>}
		</div>
	);
}

export default SearchableSelect;
