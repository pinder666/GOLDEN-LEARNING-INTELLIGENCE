import { createContext, useContext, useState, ReactNode } from 'react';

type ActiveView = 'home' | 'team' | 'player' | 'event' | 'messages';

interface CommandCenterState {
	selectedTeamId: string | null;
	selectedPlayerId: string | null;
	activeView: ActiveView;
	setSelectedTeamId: (id: string | null) => void;
	setSelectedPlayerId: (id: string | null) => void;
	setActiveView: (view: ActiveView) => void;
	goBack: () => void;
}

const CommandCenterContext = createContext<CommandCenterState | null>(null);

export const useCommandCenter = () => {
	const context = useContext(CommandCenterContext);
	if (!context) {
		throw new Error('useCommandCenter must be used within CommandCenterProvider');
	}
	return context;
};

interface ProviderProps {
	children: ReactNode;
}

export const CommandCenterProvider = ({ children }: ProviderProps) => {
	const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
	const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
	const [activeView, setActiveView] = useState<ActiveView>('home');

	const goBack = () => {
		if (selectedPlayerId) {
			setSelectedPlayerId(null);
			setActiveView('team');
		} else if (selectedTeamId) {
			setSelectedTeamId(null);
			setActiveView('home');
		}
	};

	return (
		<CommandCenterContext.Provider
			value={{
				selectedTeamId,
				selectedPlayerId,
				activeView,
				setSelectedTeamId,
				setSelectedPlayerId,
				setActiveView,
				goBack,
			}}
		>
			{children}
		</CommandCenterContext.Provider>
	);
};
