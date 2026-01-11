import { ReactNode } from 'react';
import { CardsDialogProvider } from '../cards-dialog';
import { CardEffectDialogProvider } from '../card-effect-dialog';
import { CardUsageEffectProvider } from '../card-usage-effect';
import { InterceptUsageProvider } from '../intercept-usage';
import { TimerProvider } from '@/feature/Timer/context';
import { UnitSelectionProvider } from '../unit-selection';
import { ChoicePanelProvider } from '@/feature/ChoicePanel/context';
import { MulliganProvider } from '../mulligan/context';
import { AnimationProvider } from '../animation';
import { SelectEffectProvider } from '../select-effect';
import { OverclockEffectProvider } from '../overclock-effect';
import { StatusChangeProvider } from '../status-change';
import { UnitPositionProvider } from '../unit-position';
import { TurnChangeEffectProvider } from '../turn-change-effect';

interface Props {
  children: ReactNode;
}

export const GameContextProvider = ({ children }: Props) => {
  return (
    <CardsDialogProvider>
      <CardEffectDialogProvider>
        <CardUsageEffectProvider>
          <InterceptUsageProvider>
            <TimerProvider>
              <ChoicePanelProvider>
                <MulliganProvider>
                  <UnitSelectionProvider>
                    <AnimationProvider>
                      <SelectEffectProvider>
                        <OverclockEffectProvider>
                          <StatusChangeProvider>
                            <UnitPositionProvider>
                              <TurnChangeEffectProvider>{children}</TurnChangeEffectProvider>
                            </UnitPositionProvider>
                          </StatusChangeProvider>
                        </OverclockEffectProvider>
                      </SelectEffectProvider>
                    </AnimationProvider>
                  </UnitSelectionProvider>
                </MulliganProvider>
              </ChoicePanelProvider>
            </TimerProvider>
          </InterceptUsageProvider>
        </CardUsageEffectProvider>
      </CardEffectDialogProvider>
    </CardsDialogProvider>
  );
};
