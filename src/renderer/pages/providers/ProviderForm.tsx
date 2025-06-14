import React, { useEffect, useState } from 'react';
import {
  Field,
  InfoLabel,
  Input,
  Label,
  Select,
  Switch,
} from '@fluentui/react-components';
import { getChatAPISchema } from 'providers';
import { IChatProviderConfig } from 'providers/types';
import { useTranslation } from 'react-i18next';
import MaskableInput from 'renderer/components/MaskableInput';
import useProviderStore from 'stores/useProviderStore';
import { isBlank, isValidHttpHRL } from 'utils/validators';

export default function ProviderForm() {
  const { t } = useTranslation();
  const provider = useProviderStore(
    (state) => state.provider as IChatProviderConfig,
  );
  const [oldName, setOldName] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [endpoint, setEndpoint] = useState<string>('');
  const [authEndpoint, setAuthEndpoint] = useState<string>('');
  const [endpointError, setEndpointError] = useState<string>('');
  const [authEndpointError, setAuthEndpointError] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [secretError, setSecretError] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [versionError, setVersionError] = useState<string>('');
  const [clientId, setClientId] = useState<string>(''); // Add state for clientId
  const [clientSecret, setClientSecret] = useState<string>(''); // Add state for clientSecret
  const [rqUID, setRqUID] = useState<string>(''); // Add state for rqUID
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const { updateProvider, isProviderDuplicated } = useProviderStore();

  useEffect(() => {
    setOldName(provider.name || '');
    setName(provider.name || '');
    setEndpoint(provider.apiBase || '');
    setAuthEndpoint((provider as any).authBase || '');
    setApiKey(provider.apiKey || '');
    setCurrency(provider.currency || 'USD');
    setSecret(provider.apiSecret || '');
    setVersion(provider.apiVersion || '');
    setClientId(provider.clientId || ''); // Initialize clientId
    setClientSecret(provider.clientSecret || ''); // Initialize clientSecret
    setRqUID(provider.rqUID || ''); // Initialize rqUID
    setIsDefault(provider.isDefault || false);
    return () => {
      setName('');
      setEndpoint('');
      setAuthEndpoint('');
      setSecret('');
      setVersion('');
      setNameError('');
      setEndpointError('');
      setAuthEndpointError('');
      setSecretError('');
      setVersionError('');
      setClientId(''); // Clear clientId
      setClientSecret(''); // Clear clientSecret
      setRqUID(''); // Clear rqUID
      setIsDefault(false);
      setCurrency('USD');
    };
  }, [provider]);

  return (
    <div className="provider-form w-full bg-zinc-50 dark:bg-zinc-800/10 p-4 border-b border-base">
      <div className="flex justify-around items-center gap-1 pb-1">
        <Field
          className="flex-grow min-w-[185px] -mb-0.5"
          size="small"
          validationState={nameError ? 'error' : 'none'}
          validationMessage={nameError}
        >
          <InfoLabel
            size="small"
            info={
              provider.isBuiltIn
                ? t('Provider.Tooltip.NameOfBuiltinProviderIsReadyOnly')
                : t('Provider.Tooltip.NameOfProviderMustBeUnique')
            }
          >
            {t('Common.Name')}
          </InfoLabel>
          <Input
            value={name}
            disabled={provider.isBuiltIn}
            onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
              if (oldName === ev.target.value) {
                setNameError('');
                return;
              }
              if (isBlank(ev.target.value)) {
                setNameError(t('Common.Required'));
              } else if (isProviderDuplicated(ev.target.value)) {
                setNameError(t('Provider.Tooltip.NameOfProviderMustBeUnique'));
              } else {
                setNameError('');
                updateProvider(oldName, { name: ev.target.value });
                setName(ev.target.value);
                setOldName(ev.target.value);
              }
            }}
            onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
              setName(ev.target.value);
              if (oldName === ev.target.value) {
                setNameError('');
                return;
              }
              if (isBlank(ev.target.value)) {
                setNameError(t('Common.Required'));
              } else if (isProviderDuplicated(ev.target.value)) {
                setNameError(t('Provider.Tooltip.NameOfProviderMustBeUnique'));
              } else {
                setNameError('');
              }
            }}
          />
        </Field>
        <Field
          label={t('Common.Currency')}
          className="flex-shrink-0 min-w-[90px]"
          size="small"
        >
          <Select
            value={currency}
            onChange={(ev) => {
              setCurrency(ev.target.value);
              updateProvider(name, {
                currency: ev.target.value as 'USD' | 'CNY' | 'RUB',
              });
            }}
          >
            <option>USD</option>
            <option>CNY</option>
            <option>RUB</option>
          </Select>
        </Field>
        <Field size="small" className="-mb-2 ml-1">
          <Label className="w-[50px] -mb-0.5" size="small">
            {t('Common.Default')}
          </Label>
          <Switch
            checked={isDefault}
            className="-ml-1"
            onChange={(ev) => {
              const isChecked = ev.target.checked;
              setIsDefault(isChecked);
              updateProvider(name, {
                isDefault: isChecked,
              });
            }}
          />
        </Field>
      </div>
      <div className="mt-2 flex justify-start items-baseline gap-1">
        <Label className="w-[70px]" size="small">
          {t('Common.APIEndpoint')}
        </Label>
        <Field
          size="small"
          className="field-small flex-grow"
          validationState={endpointError ? 'error' : 'none'}
          validationMessage={endpointError}
        >
          <Input
            size="small"
            value={endpoint}
            className="flex-grow"
            onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
              if (isValidHttpHRL(ev.target.value)) {
                updateProvider(name, {
                  apiBase: ev.target.value,
                });
              } else {
                setEndpointError(t('Provider.Tooltip.InvalidAPIEndpoint'));
              }
            }}
            onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
              setEndpoint(ev.target.value);
              if (isValidHttpHRL(ev.target.value)) {
                setEndpointError('');
              } else {
                setEndpointError(t('Provider.Tooltip.InvalidAPIEndpoint'));
              }
            }}
            placeholder={provider.apiBase || ''}
          />
        </Field>
      </div>
      {/* Дополнительный эндпоинт для аутентификации GigaChat */}
      {provider.name === 'GigaChat' && (
        <div className="mt-2 flex justify-start items-baseline gap-1">
          <Label className="w-[70px]" size="small">
            Auth URL
          </Label>
          <Field
            size="small"
            className="field-small flex-grow"
            validationState={authEndpointError ? 'error' : 'none'}
            validationMessage={authEndpointError}
          >
            <Input
              size="small"
              value={authEndpoint}
              className="flex-grow"
              placeholder={(provider as any).authBase || 'https://ngw.devices.sberbank.ru:9443/oauth'}
              onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
                if (isValidHttpHRL(ev.target.value)) {
                  updateProvider(name, {
                    authBase: ev.target.value,
                  } as any);
                } else {
                  setAuthEndpointError(t('Provider.Tooltip.InvalidAPIEndpoint'));
                }
              }}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setAuthEndpoint(ev.target.value);
                if (isValidHttpHRL(ev.target.value)) {
                  setAuthEndpointError('');
                } else {
                  setAuthEndpointError(t('Provider.Tooltip.InvalidAPIEndpoint'));
                }
              }}
            />
          </Field>
        </div>
      )}
      {getChatAPISchema(provider.name || '').includes('key') && (
        <div className="mt-2 flex justify-start items-baseline gap-1">
          <Label className="w-[70px]" size="small">
            {t('Common.APIKey')}
          </Label>
          <Field
            size="small"
            className="field-small flex-grow"
            validationState={apiKeyError ? 'error' : 'none'}
            validationMessage={apiKeyError}
          >
            <MaskableInput
              className="flex-grow"
              value={apiKey}
              onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
                if (isBlank(ev.target.value)) {
                  setApiKeyError(t('Common.Required'));
                } else {
                  setApiKeyError('');
                  updateProvider(name, {
                    apiKey: ev.target.value,
                  });
                }
              }}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setApiKey(ev.target.value);
                if (isBlank(ev.target.value)) {
                  setApiKeyError(t('Common.Required'));
                } else {
                  setApiKeyError('');
                }
              }}
            />
          </Field>
        </div>
      )}
      {getChatAPISchema(provider.name || '').includes('secret') && (
        <div className="mt-2 flex justify-start items-baseline gap-1">
          <Label className="w-[70px]" size="small">
            {t('Common.SecretKey')}
          </Label>
          <Field
            size="small"
            className="field-small flex-grow"
            validationState={secretError ? 'error' : 'none'}
            validationMessage={secretError}
          >
            <MaskableInput
              value={secret}
              onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
                if (isBlank(ev.target.value)) {
                  setSecretError(t('Common.Required'));
                } else {
                  setSecretError('');
                  updateProvider(name, {
                    apiSecret: ev.target.value,
                  });
                }
              }}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setSecret(ev.target.value);
                if (isBlank(ev.target.value)) {
                  setSecretError(t('Common.Required'));
                } else {
                  setSecretError('');
                }
              }}
            />
          </Field>
        </div>
      )}
      {getChatAPISchema(provider.name || '').includes('version') && (
        <div className="mt-2 flex justify-start items-baseline gap-1">
          <Label className="w-[70px]" size="small">
            {t('Common.APIVersion')}
          </Label>
          <Field
            size="small"
            className="field-small flex-grow"
            validationState={versionError ? 'error' : 'none'}
            validationMessage={versionError}
          >
            <Input
              value={version}
              onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
                if (isBlank(ev.target.value)) {
                  setVersionError(t('Common.Required'));
                } else {
                  setVersionError('');
                  updateProvider(name, {
                    apiVersion: ev.target.value,
                  });
                }
              }}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setVersion(ev.target.value);
                if (isBlank(ev.target.value)) {
                  setVersionError(t('Common.Required'));
                } else {
                  setVersionError('');
                }
              }}
            />
          </Field>
        </div>
      )}

      {/* New fields for GigaChat */}
      {getChatAPISchema(provider.name || '').includes('clientId') && (
        <div className="mt-2 flex justify-start items-baseline gap-1">
          <Label className="w-[70px]" size="small">
            {t('Common.ClientId')} {/* Use translation for label */}
          </Label>
          <Field
            size="small"
            className="field-small flex-grow"
            // Add validation state and message if needed
          >
            <Input
              size="small"
              value={clientId}
              className="flex-grow"
              onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
                // Add validation and update logic
                updateProvider(name, {
                  clientId: ev.target.value,
                });
              }}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setClientId(ev.target.value);
                // Add validation logic if needed
              }}
            />
          </Field>
        </div>
      )}
      {getChatAPISchema(provider.name || '').includes('clientSecret') && (
        <div className="mt-2 flex justify-start items-baseline gap-1">
          <Label className="w-[70px]" size="small">
            {t('Common.ClientSecret')} {/* Use translation for label */}
          </Label>
          <Field
            size="small"
            className="field-small flex-grow"
            // Add validation state and message if needed
          >
            <MaskableInput
              value={clientSecret}
              onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
                // Add validation and update logic
                updateProvider(name, {
                  clientSecret: ev.target.value,
                });
              }}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setClientSecret(ev.target.value);
                // Add validation logic if needed
              }}
            />
          </Field>
        </div>
      )}
      {getChatAPISchema(provider.name || '').includes('rqUID') && (
        <div className="mt-2 flex justify-start items-baseline gap-1">
          <Label className="w-[70px]" size="small">
            {t('Common.RqUID')} {/* Use translation for label */}
          </Label>
          <Field size="small" className="field-small flex-grow">
            <Input
              size="small"
              value={rqUID}
              className="flex-grow"
              onBlur={(ev: React.FocusEvent<HTMLInputElement>) => {
                updateProvider(name, { rqUID: ev.target.value });
              }}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setRqUID(ev.target.value);
              }}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
