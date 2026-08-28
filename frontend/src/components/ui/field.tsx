import * as React from 'react'

/**
 * FieldSet: Semantic container grouping related fields with legend and description.
 */
export const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>
>(({ className = '', ...props }, ref) => (
  <fieldset
    ref={ref}
    className={`space-y-4 border-0 p-0 m-0 ${className}`}
    {...props}
  />
))
FieldSet.displayName = 'FieldSet'

/**
 * FieldLegend: Legend header for a FieldSet.
 */
export interface FieldLegendProps
  extends React.HTMLAttributes<HTMLLegendElement> {
  variant?: 'legend' | 'label'
}

export const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  FieldLegendProps
>(({ className = '', variant = 'legend', ...props }, ref) => (
  <legend
    ref={ref}
    className={`font-semibold tracking-tight text-[#191919] ${
      variant === 'legend'
        ? 'text-base mb-1'
        : 'text-xs uppercase tracking-wider text-[#6b6b66]'
    } ${className}`}
    {...props}
  />
))
FieldLegend.displayName = 'FieldLegend'

/**
 * FieldGroup: Layout container that stacks Field elements.
 */
export const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col gap-4 @container/field-group ${className}`}
    {...props}
  />
))
FieldGroup.displayName = 'FieldGroup'

/**
 * Field: Core wrapper for a single field with orientation and validation states.
 */
export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  'data-invalid'?: boolean
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      className = '',
      orientation = 'vertical',
      'data-invalid': isInvalid,
      ...props
    },
    ref
  ) => {
    const orientationClass =
      orientation === 'horizontal'
        ? 'flex flex-row items-center justify-between gap-4'
        : orientation === 'responsive'
        ? 'flex flex-col @md/field-group:flex-row @md/field-group:items-center @md/field-group:justify-between gap-2 @md/field-group:gap-4'
        : 'flex flex-col gap-1.5'

    return (
      <div
        ref={ref}
        role="group"
        data-invalid={isInvalid}
        className={`w-full group ${orientationClass} ${className}`}
        {...props}
      />
    )
  }
)
Field.displayName = 'Field'

/**
 * FieldContent: Flex container that groups control and description.
 */
export const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`flex flex-col gap-1 ${className}`} {...props} />
))
FieldContent.displayName = 'FieldContent'

/**
 * FieldLabel: Label styled for inputs, switches, and selects.
 */
export const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = '', ...props }, ref) => (
  <label
    ref={ref}
    className={`text-xs font-semibold uppercase tracking-wider text-[#191919] group-data-[invalid=true]:text-[#ba1a1a] cursor-pointer ${className}`}
    {...props}
  />
))
FieldLabel.displayName = 'FieldLabel'

/**
 * FieldTitle: Title with label styling inside FieldContent.
 */
export const FieldTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h4
    ref={ref}
    className={`text-sm font-semibold text-[#191919] m-0 ${className}`}
    {...props}
  />
))
FieldTitle.displayName = 'FieldTitle'

/**
 * FieldDescription: Subtle helper/hint text below a control.
 */
export const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={`text-xs text-[#6b6b66] leading-relaxed m-0 ${className}`}
    {...props}
  />
))
FieldDescription.displayName = 'FieldDescription'

/**
 * FieldSeparator: Divider element with optional inline text.
 */
export const FieldSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative flex py-2 items-center text-xs text-[#6b6b66] ${className}`}
    {...props}
  >
    <div className="grow border-t border-[#e5e5e0]" />
    {children && <span className="shrink mx-3 text-[#6b6b66]">{children}</span>}
    <div className="grow border-t border-[#e5e5e0]" />
  </div>
))
FieldSeparator.displayName = 'FieldSeparator'

/**
 * FieldError: Validation error text or list of error messages.
 */
export interface FieldErrorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  errors?: Array<{ message?: string } | string | undefined>
}

export const FieldError = React.forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ className = '', errors, children, ...props }, ref) => {
    const errorMessages = Array.isArray(errors)
      ? errors
          .map((e) => (typeof e === 'string' ? e : e?.message))
          .filter(Boolean)
      : null

    if (!children && (!errorMessages || errorMessages.length === 0)) {
      return null
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={`text-xs text-[#ba1a1a] font-medium flex flex-col gap-0.5 mt-0.5 ${className}`}
        {...props}
      >
        {children}
        {errorMessages &&
          errorMessages.map((msg, i) => <span key={i}>{msg}</span>)}
      </div>
    )
  }
)
FieldError.displayName = 'FieldError'
