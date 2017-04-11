import React from 'react';
import Relay from 'react-relay';

import { IUserArgs, User } from 'ptz-user-domain';

import SaveUserMutation from "../mutations/SaveUserMutation";

import UserComponent from './User';
import CreateUserForm from './CreateUserForm';

class UserReport extends React.Component<any, any>{

    constructor(props) {
        super(props);
        this.state = { user: {} };
    }

    setLimit = (e) => {
        var newLimit = Number(e.target.value);
        this.props.relay.setVariables({ limit: newLimit });
        console.log('newLimit', newLimit);
        console.log('relay', this.props.relay);
    }

    private getNewUser() {
        return new User({
            displayName: '',
            email: '',
            userName: ''
        });
    }

    createUser = (userArgs) => {
        const user = new User(userArgs);
        this.setState({ user });
        console.log('UserReport createUser() user', user);

        if (!user.isValid())
            return;

        Relay.Store.commitUpdate(
            new SaveUserMutation({
                user,
                store: this.props.store
            }),
            {
                onFailure: transaction => {
                    console.log('onFailure response', transaction);
                },
                onSuccess: response => {
                    console.log('onSuccess response', response);
                    console.log('user response', response.saveUser.userEdge.node);
                    const user = new User(response.saveUser.userEdge.node);
                    this.setState({ user: user.isValid() ? {} : user });
                }
            }
        );
    }

    render() {
        var content = this.props.store.userConnection.edges.map(edge => {
            return <UserComponent key={edge.node.id} user={edge.node} />;
        });

        console.log('rendering UserReport user:', this.state.user);

        return (
            <section>
                <h1>Users2</h1>
                <CreateUserForm createUser={this.createUser} user={this.state.user} />
                <label htmlFor='pagination-limit'>Showing</label>
                <select id='pagination-limit' onChange={this.setLimit}
                    defaultValue={this.props.relay.variables.limit}>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
                <ul>
                    {content}
                </ul>
            </section>);
    }
}

export default Relay.createContainer(UserReport, {
    initialVariables: {
        limit: 20
    },
    fragments: {
        store: () => Relay.QL`
        fragment on Store{
            id,
            userConnection(first: $limit){
                edges{
                    node{
                        id,
                        ${UserComponent.getFragment('user')},
                        errors
                    }
                }
            }
        }
       `
    }
});
