import { FC, PropsWithChildren } from 'react';
import { FormProvider, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { cn } from '../utils/cn';

export interface FormProps extends Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  methods: UseFormReturn<any>;
  onSubmit: SubmitHandler<any>;
  onError?: (error: any) => void;
}

export const Form: FC<PropsWithChildren<FormProps>> = ({
  children,
  methods,
  onSubmit,
  onError = console.warn,
  className,
  ...props
}) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, onError)} className={cn(className)} {...props}>
        {children}
      </form>
    </FormProvider>
  );
};
