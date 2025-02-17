import { computed, inject, SetupContext, toRef, provide } from 'vue';
import {
  CheckboxProps,
  UseCheckboxFn,
  checkboxGroupInjectionKey,
  CheckboxGroupProps,
  UseCheckboxGroupFn,
  UseCheckboxButtonFn,
} from './checkbox-types';

export function useCheckbox(props: CheckboxProps, ctx: SetupContext): UseCheckboxFn {
  const checkboxGroupConf = inject(checkboxGroupInjectionKey, null);

  const isChecked = computed(() => props.checked || props.modelValue);
  const mergedChecked = computed(() => {
    return checkboxGroupConf?.isItemChecked?.(props.value) ?? isChecked.value;
  });
  const isLimitDisabled = computed(() => {
    const max = checkboxGroupConf?.max.value;
    return !!max && checkboxGroupConf?.modelValue.value.length >= max && !mergedChecked.value;
  });
  const mergedDisabled = computed(() => {
    return checkboxGroupConf?.disabled.value || props.disabled || isLimitDisabled.value;
  });
  const mergedIsShowTitle = computed(() => {
    return checkboxGroupConf?.isShowTitle.value ?? props.isShowTitle;
  });
  const mergedShowAnimation = computed(() => {
    return checkboxGroupConf?.showAnimation.value ?? props.showAnimation;
  });
  const mergedColor = computed(() => {
    return checkboxGroupConf?.color.value ?? props.color;
  });
  const itemWidth = checkboxGroupConf?.itemWidth.value;
  const direction = checkboxGroupConf?.direction.value;

  const canChange = (checked: boolean, val: string | undefined) => {
    if (mergedDisabled.value) {
      return Promise.resolve(false);
    }

    const beforeChange = props.beforeChange ?? checkboxGroupConf?.beforeChange;
    if (beforeChange) {
      const res = beforeChange(checked, val);
      if (typeof res === 'boolean') {
        return Promise.resolve(res);
      }
      return res;
    }
    return Promise.resolve(true);
  };
  const toggle = () => {
    const current = !isChecked.value;
    checkboxGroupConf?.toggleGroupVal(props.value);
    ctx.emit('update:checked', current);
    ctx.emit('update:modelValue', current);
    ctx.emit('change', current);
  };
  const handleClick = () => {
    canChange(!isChecked.value, props.label).then((res) => res && toggle());
  };
  const size = computed(() => checkboxGroupConf?.size.value ?? props.size);
  const border = computed(() => checkboxGroupConf?.border.value ?? props.border);
  return {
    mergedChecked,
    mergedDisabled,
    mergedIsShowTitle,
    mergedShowAnimation,
    mergedColor,
    itemWidth,
    direction,
    handleClick,
    size,
    border,
  };
}

export function useCheckboxGroup(props: CheckboxGroupProps, ctx: SetupContext): UseCheckboxGroupFn {
  const valList = toRef(props, 'modelValue');

  const defaultOpt = {
    checked: false,
    isShowTitle: true,
    halfChecked: false,
    showAnimation: true,
    disabled: false,
  };
  const toggleGroupVal = (val: string | number) => {
    let index = -1;
    if (['string', 'number'].includes(typeof valList.value[0])) {
      index = valList.value.findIndex((item) => item === val);
    } else if (typeof valList.value[0] === 'object') {
      index = valList.value.findIndex((item) => item.value === val);
    }

    if (index === -1) {
      if (typeof props.options[0] === 'object') {
        const newOne = props.options.find((item) => item.value === val);
        const res = [...valList.value, newOne];
        ctx.emit('update:modelValue', res);
        ctx.emit('change', res);
        return;
      }
      const res = [...valList.value, val];
      ctx.emit('update:modelValue', res);
      ctx.emit('change', res);
      return;
    }
    valList.value.splice(index, 1);
    ctx.emit('update:modelValue', valList.value);
    ctx.emit('change', valList.value);
  };
  const isItemChecked = (itemVal: string | number) => {
    if (['string', 'number'].includes(typeof valList.value[0])) {
      return valList.value.includes(itemVal);
    } else if (typeof valList.value[0] === 'object') {
      return valList.value.some((item) => item.value === itemVal);
    }
  };

  provide(checkboxGroupInjectionKey, {
    disabled: toRef(props, 'disabled'),
    isShowTitle: toRef(props, 'isShowTitle'),
    color: toRef(props, 'color'),
    showAnimation: toRef(props, 'showAnimation'),
    beforeChange: props.beforeChange,
    isItemChecked,
    toggleGroupVal,
    itemWidth: toRef(props, 'itemWidth'),
    direction: toRef(props, 'direction'),
    size: toRef(props, 'size'),
    border: toRef(props, 'border'),
    max: toRef(props, 'max'),
    modelValue: toRef(props, 'modelValue'),
    textColor: toRef(props, 'textColor'),
  });
  return { defaultOpt };
}

export function useCheckboxButton(): UseCheckboxButtonFn {
  const checkboxGroupConf = inject(checkboxGroupInjectionKey, null);
  const mergedTextColor = computed(() => {
    return checkboxGroupConf?.textColor.value ?? undefined;
  });

  return {
    mergedTextColor,
  };
}
