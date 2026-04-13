import { SelectProps } from "@radix-ui/react-select"
import { useMemo } from "react"
import { FormSelect } from "./simple"

export const FormSelectCurrency = ({
  currencies,
  title,
  emptyValue,
  placeholder,
  hideIfEmpty = false,
  isRequired = false,
  triggerClassName,
  addNewHref,
  addNewLabel,
  ...props
}: {
  currencies: { code: string; name: string }[]
  title?: string
  emptyValue?: string
  placeholder?: string
  hideIfEmpty?: boolean
  isRequired?: boolean
  triggerClassName?: string
  addNewHref?: string
  addNewLabel?: string
} & SelectProps) => {
  const items = useMemo(
    () =>
      currencies.map((currency) => ({
        code: currency.code,
        name: currency.code,
      })),
    [currencies]
  )
  return (
    <FormSelect
      title={title}
      items={items}
      emptyValue={emptyValue}
      placeholder={placeholder}
      hideIfEmpty={hideIfEmpty}
      isRequired={isRequired}
      triggerClassName={triggerClassName}
      addNewHref={addNewHref}
      addNewLabel={addNewLabel}
      {...props}
    />
  )
}
